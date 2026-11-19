/* Botslab Routines Card — create/edit the vacuum's cleaning routines.
 * Reads sensor.<device>_schedules (schedules + rooms) and calls
 * botslab_vacuum.set_schedule / delete_schedule / run_schedule services.
 * Bilingual: English and Turkish with automatic language detection.
 * Native Home Assistant notifications and visual UI editor.
 */

const SUCTIONS = ["quiet", "standard", "powerful", "max", "auto"];

const I18N = {
  tr: {
    header: "Temizlik Rutinleri",
    addBtn: "＋ Yeni Rutin",
    empty: "Kayıtlı rutin yok. '＋ Yeni Rutin' ile ekleyin.",
    noEntity: "Lütfen kart yapılandırmasından bir süpürge (vacuum) varlığı seçin.",
    wholeHouse: "Tüm Ev",
    passes1: "1 geçiş",
    passes2: "2 geçiş",
    dayLabels: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
    time: "Başlangıç Saati",
    days: "Günler",
    roomsLabel: "Odalar (temizleme sırasına göre tıklayın; boş = tüm ev)",
    mapNotLoaded: "Harita henüz yüklenmedi",
    suction: "Emiş Gücü",
    suctions: { quiet: "Sessiz", standard: "Standart", powerful: "Güçlü", max: "Maksimum", auto: "Otomatik" },
    passes: "Geçiş Sayısı",
    active: "Aktif",
    cancel: "İptal",
    save: "Kaydet",
    create: "Oluştur",
    pickOneDay: "Lütfen en az bir gün seçin.",
    runNowTitle: "Şimdi Çalıştır",
    editTitle: "Düzenle",
    deleteTitle: "Sil",
    deleteConfirm: "Silmek için tekrar tıklayın",
    routineStarted: "Rutin başlatılıyor...",
    routineSaved: "Rutin başarıyla kaydedildi.",
    routineDeleted: "Rutin silindi.",
    errorSaving: "Rutin kaydedilirken hata oluştu: ",
  },
  en: {
    header: "Cleaning Routines",
    addBtn: "＋ New Routine",
    empty: "No routines saved. Create one with '＋ New Routine'.",
    noEntity: "Please select a vacuum entity in the card configuration.",
    wholeHouse: "Whole House",
    passes1: "1 pass",
    passes2: "2 passes",
    dayLabels: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    time: "Start Time",
    days: "Days",
    roomsLabel: "Rooms (tap in order to clean; empty = whole house)",
    mapNotLoaded: "Map not loaded yet",
    suction: "Suction Power",
    suctions: { quiet: "Quiet", standard: "Standard", powerful: "Strong", max: "Max", auto: "Auto" },
    passes: "Passes",
    active: "Active",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    pickOneDay: "Select at least one day.",
    runNowTitle: "Run now",
    editTitle: "Edit",
    deleteTitle: "Delete",
    deleteConfirm: "Click again to confirm delete",
    routineStarted: "Starting routine...",
    routineSaved: "Routine saved successfully.",
    routineDeleted: "Routine deleted.",
    errorSaving: "Error saving routine: ",
  }
};

class BotslabRoutinesCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
    }
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = [
        { name: "entity", required: true, selector: { entity: { domain: "vacuum" } } },
        { name: "title", selector: { text: {} } },
        { name: "schedules_entity", selector: { entity: { domain: "sensor" } } },
      ];
      this._form.computeLabel = (s) => {
        if (s.name === "entity") return "Vacuum Entity";
        if (s.name === "title") return "Card Title (optional)";
        if (s.name === "schedules_entity") return "Schedules Sensor (optional)";
        return s.name;
      };
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = Object.assign({}, this._config, ev.detail.value);
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }
    this._form.data = this._config;
    if (this._hass) {
      this._form.hass = this._hass;
    }
  }
}

if (!customElements.get("botslab-routines-card-editor")) {
  customElements.define("botslab-routines-card-editor", BotslabRoutinesCardEditor);
}

class BotslabRoutinesCard extends HTMLElement {
  static async getConfigElement() {
    return document.createElement("botslab-routines-card-editor");
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "vacuum" } } },
        { name: "title", selector: { text: {} } },
        { name: "schedules_entity", selector: { entity: { domain: "sensor" } } },
      ],
      computeLabel: (s) => {
        if (s.name === "entity") return "Vacuum Entity";
        if (s.name === "title") return "Card Title (optional)";
        if (s.name === "schedules_entity") return "Schedules Sensor (optional)";
        return s.name;
      },
    };
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    const list = entities || [];
    const vac =
      list.find((e) => e.startsWith("vacuum.")) ||
      Object.keys(hass?.states || {}).find((s) => s.startsWith("vacuum.")) ||
      "";
    const sched = Object.keys(hass?.states || {}).find(
      (id) => id.startsWith("sensor.") && hass?.states[id]?.attributes?.schedules !== undefined
    );
    return {
      type: "custom:botslab-routines-card",
      ...(vac ? { entity: vac } : {}),
      ...(sched ? { schedules_entity: sched } : {}),
    };
  }

  setConfig(config) {
    this._config = Object.assign({}, config);
    this._editing = null;
    this._built = false;
    this._lastKey = null;
    this._armDeleteSlot = null;
    if (this._hass) this._ensureEntity();
  }

  set hass(hass) {
    this._hass = hass;
    this._ensureEntity();
    if (!this._built) this._build();
    if (!this._editing) {
      const key = JSON.stringify(this._data());
      if (key !== this._lastKey) {
        this._lastKey = key;
        this._renderList();
      }
    }
  }

  getCardSize() {
    return 8;
  }

  _notify(message) {
    window.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: { message },
        bubbles: true,
        composed: true,
      })
    );
  }

  _ensureEntity() {
    if (!this._config.entity && this._hass && this._hass.states) {
      const vac = Object.keys(this._hass.states).find((s) => s.startsWith("vacuum."));
      if (vac) {
        this._config.entity = vac;
      }
    }
    if (!this._config.schedules_entity && this._hass && this._hass.states) {
      const sched = Object.keys(this._hass.states).find(
        (id) => id.startsWith("sensor.") && this._hass.states[id]?.attributes?.schedules !== undefined
      );
      if (sched) {
        this._config.schedules_entity = sched;
      }
    }
  }

  _t() {
    const lang = (this._hass && (this._hass.language || this._hass.locale?.language || "")) || "en";
    return lang.startsWith("tr") ? I18N.tr : I18N.en;
  }

  _schedEntity() {
    if (this._config.schedules_entity) return this._config.schedules_entity;
    if (this._hass && this._hass.states) {
      const found = Object.keys(this._hass.states).find(
        (id) => id.startsWith("sensor.") && this._hass.states[id]?.attributes?.schedules !== undefined
      );
      if (found) return found;
    }
    if (!this._config.entity) return null;
    const parts = this._config.entity.split(".");
    return parts.length > 1 ? "sensor." + parts[1] + "_schedules" : null;
  }

  _data() {
    const ent = this._schedEntity();
    const st = ent && this._hass && this._hass.states[ent];
    const a = st ? st.attributes : {};
    return { schedules: a.schedules || [], rooms: a.rooms || {} };
  }

  _call(service, data) {
    if (!this._config.entity) return Promise.reject(new Error("No vacuum entity configured"));
    return this._hass.callService("botslab_vacuum", service, data, {
      entity_id: this._config.entity,
    });
  }

  _build() {
    const t = this._t();
    const headerTitle = this._config.title || t.header;
    this.innerHTML = `
      <ha-card>
        <style>
          .wrap{padding:8px 16px 16px}
          .row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--divider-color)}
          .row:first-child{border-top:none}
          .time{font-size:18px;font-weight:600;min-width:60px}
          .mid{flex:1;min-width:0}
          .days{font-size:12px;color:var(--secondary-text-color)}
          .sub{font-size:12px;color:var(--secondary-text-color);margin-top:2px}
          .btns{display:flex;align-items:center;gap:4px}
          ha-icon-button{--mdc-icon-button-size:36px}
          .addbtn{margin-top:12px}
          .editor{padding:12px;background:var(--secondary-background-color);border-radius:8px;margin-top:12px}
          .field{margin-bottom:12px}
          .field label{display:block;font-size:12px;color:var(--secondary-text-color);margin-bottom:4px}
          .daygrid{display:flex;gap:4px;flex-wrap:wrap}
          .daychip{padding:6px 10px;border-radius:16px;border:1px solid var(--divider-color);cursor:pointer;font-size:12px;user-select:none}
          .daychip.on{background:var(--primary-color);color:var(--primary-text-color, #fff);border-color:var(--primary-color)}
          .roomgrid{display:flex;gap:6px;flex-wrap:wrap}
          .roomchip{padding:6px 10px;border-radius:6px;border:1px solid var(--divider-color);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;user-select:none}
          .roomchip.on{background:var(--primary-color);color:var(--primary-text-color, #fff);border-color:var(--primary-color)}
          .ord{display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;border-radius:50%;background:#fff;color:var(--primary-color);font-size:10px;font-weight:700}
          select,input[type=time]{padding:6px 8px;border-radius:4px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font-size:14px}
          .actrow{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
          .muted{color:var(--secondary-text-color);font-style:italic}
          .del-armed{color:var(--error-color, #db4437)}
          .ed-error{color:var(--error-color, #db4437);font-size:13px;margin-top:8px;display:none}
        </style>
        <div class="wrap">
          <div id="list"></div>
          <div id="editor"></div>
          <mwc-button id="addbtn" class="addbtn" outlined></mwc-button>
        </div>
      </ha-card>
    `;
    const card = this.querySelector("ha-card");
    if (card) card.setAttribute("header", headerTitle);
    const addBtn = this.querySelector("#addbtn");
    if (addBtn) {
      addBtn.textContent = t.addBtn;
      addBtn.addEventListener("click", () => this._openEditor(-1));
    }
    this._renderList();
  }

  _renderList() {
    const t = this._t();
    const list = this.querySelector("#list");
    const addBtn = this.querySelector("#addbtn");

    if (!this._config.entity) {
      if (list) {
        list.innerHTML = "";
        const muted = document.createElement("div");
        muted.className = "muted";
        muted.style.cssText = "padding:16px 0;text-align:center";
        muted.textContent = t.noEntity;
        list.appendChild(muted);
      }
      if (addBtn) addBtn.style.display = "none";
      return;
    }
    if (addBtn && !this._editing) addBtn.style.display = "";

    const { schedules, rooms } = this._data();
    if (!list) return;
    list.innerHTML = "";

    if (!schedules.length) {
      const muted = document.createElement("div");
      muted.className = "muted";
      muted.style.padding = "8px 0";
      muted.textContent = t.empty;
      list.appendChild(muted);
      return;
    }

    schedules.forEach((s) => {
      const slot = s.slot;
      const dayNames = (s.days || []).map((d) => t.dayLabels[d]).join(" ");
      const rList = s.room_ids || [];
      let target;
      if (rList && rList.length) {
        target = rList.map((r) => rooms[r] || `#${r}`).join(" → ");
      } else {
        target = t.wholeHouse;
      }
      const suc = t.suctions[s.suction] || s.suction;
      const passText = s.passes === 2 ? t.passes2 : t.passes1;
      const isDelArmed = this._armDeleteSlot === slot;

      const row = document.createElement("div");
      row.className = "row";
      row.dataset.slot = String(slot);

      const timeEl = document.createElement("div");
      timeEl.className = "time";
      timeEl.textContent = s.time || "";
      row.appendChild(timeEl);

      const midEl = document.createElement("div");
      midEl.className = "mid";

      const daysEl = document.createElement("div");
      daysEl.className = "days";
      daysEl.textContent = dayNames || "—";
      midEl.appendChild(daysEl);

      const subEl = document.createElement("div");
      subEl.className = "sub";
      subEl.textContent = `${target} • ${suc} • ${passText}`;
      midEl.appendChild(subEl);
      row.appendChild(midEl);

      const btns = document.createElement("div");
      btns.className = "btns";

      const sw = document.createElement("ha-switch");
      if (s.active) sw.setAttribute("checked", "");
      sw.addEventListener("change", (ev) => {
        const checked = ev.target.checked;
        const cur = schedules.find((item) => item.slot === slot);
        if (!cur) return;
        const curRooms = (cur.room_ids || []).map(String);
        this._call("set_schedule", {
          slot: slot,
          time: cur.time,
          days: cur.days,
          room_ids: curRooms,
          suction: cur.suction,
          passes: cur.passes,
          active: checked,
        }).catch((err) => {
          console.error(err);
          ev.target.checked = !checked;
          this._notify("Error: " + (err.message || err));
        });
      });
      btns.appendChild(sw);

      const runBtn = document.createElement("ha-icon-button");
      runBtn.className = "run-btn";
      runBtn.setAttribute("title", t.runNowTitle);
      const runIcon = document.createElement("ha-icon");
      runIcon.setAttribute("icon", "mdi:play");
      runBtn.appendChild(runIcon);
      runBtn.addEventListener("click", () => {
        this._notify(t.routineStarted);
        this._call("run_schedule", { slot: slot }).catch((err) => {
          console.error(err);
          this._notify("Error: " + (err.message || err));
        });
      });
      btns.appendChild(runBtn);

      const editBtn = document.createElement("ha-icon-button");
      editBtn.className = "edit-btn";
      editBtn.setAttribute("title", t.editTitle);
      const editIcon = document.createElement("ha-icon");
      editIcon.setAttribute("icon", "mdi:pencil");
      editBtn.appendChild(editIcon);
      editBtn.addEventListener("click", () => this._openEditor(slot));
      btns.appendChild(editBtn);

      const delBtn = document.createElement("ha-icon-button");
      delBtn.className = `del-btn ${isDelArmed ? "del-armed" : ""}`;
      delBtn.setAttribute("title", isDelArmed ? t.deleteConfirm : t.deleteTitle);
      const delIcon = document.createElement("ha-icon");
      delIcon.setAttribute("icon", isDelArmed ? "mdi:alert" : "mdi:delete");
      delBtn.appendChild(delIcon);
      delBtn.addEventListener("click", () => {
        if (this._armDeleteSlot === slot) {
          clearTimeout(this._armDeleteTimer);
          this._armDeleteSlot = null;
          this._call("delete_schedule", { slot: slot })
            .then(() => {
              this._lastKey = null;
              this._renderList();
              this._notify(t.routineDeleted);
            })
            .catch((err) => {
              console.error(err);
              this._notify("Error: " + (err.message || err));
            });
        } else {
          this._armDeleteSlot = slot;
          this._renderList();
          this._notify(t.deleteConfirm);
          clearTimeout(this._armDeleteTimer);
          this._armDeleteTimer = setTimeout(() => {
            this._armDeleteSlot = null;
            this._renderList();
          }, 4000);
        }
      });
      btns.appendChild(delBtn);

      row.appendChild(btns);
      list.appendChild(row);
    });
  }

  _openEditor(slot) {
    const { schedules } = this._data();
    if (slot >= 0) {
      const cur = schedules.find((s) => s.slot === slot);
      if (!cur) return;
      this._editing = {
        slot: cur.slot,
        time: cur.time,
        days: new Set(cur.days || []),
        rooms: [...(cur.room_ids || [])],
        suction: cur.suction || "auto",
        passes: cur.passes || 1,
        active: cur.active !== false,
      };
    } else {
      this._editing = {
        slot: -1,
        time: "09:00",
        days: new Set(),
        rooms: [],
        suction: "auto",
        passes: 1,
        active: true,
      };
    }
    const addBtn = this.querySelector("#addbtn");
    if (addBtn) addBtn.style.display = "none";
    this._renderEditor();
  }

  _closeEditor() {
    this._editing = null;
    this.querySelector("#editor").innerHTML = "";
    const addBtn = this.querySelector("#addbtn");
    if (addBtn && this._config.entity) addBtn.style.display = "";
    this._lastKey = null;
    this._renderList();
  }

  _renderEditor() {
    const t = this._t();
    const e = this._editing;
    const { rooms } = this._data();
    const ed = this.querySelector("#editor");
    if (!ed) return;
    ed.innerHTML = "";

    const editorDiv = document.createElement("div");
    editorDiv.className = "editor";

    // 1. Time field
    const timeField = document.createElement("div");
    timeField.className = "field";
    const timeLabel = document.createElement("label");
    timeLabel.textContent = t.time;
    timeField.appendChild(timeLabel);
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.id = "ed-time";
    timeInput.value = e.time || "";
    timeInput.addEventListener("change", (ev) => {
      e.time = ev.target.value;
    });
    timeField.appendChild(timeInput);
    editorDiv.appendChild(timeField);

    // 2. Days field
    const daysField = document.createElement("div");
    daysField.className = "field";
    const daysLabel = document.createElement("label");
    daysLabel.textContent = t.days;
    daysField.appendChild(daysLabel);
    const dayGrid = document.createElement("div");
    dayGrid.className = "daygrid";
    dayGrid.id = "ed-days";
    t.dayLabels.forEach((lbl, idx) => {
      const dayChip = document.createElement("div");
      dayChip.className = `daychip ${e.days.has(idx) ? "on" : ""}`;
      dayChip.dataset.day = String(idx);
      dayChip.textContent = lbl;
      dayChip.addEventListener("click", () => {
        if (e.days.has(idx)) e.days.delete(idx);
        else e.days.add(idx);
        this._renderEditor();
      });
      dayGrid.appendChild(dayChip);
    });
    daysField.appendChild(dayGrid);
    editorDiv.appendChild(daysField);

    // 3. Rooms field
    const roomsField = document.createElement("div");
    roomsField.className = "field";
    const roomsLabel = document.createElement("label");
    roomsLabel.textContent = t.roomsLabel;
    roomsField.appendChild(roomsLabel);
    const roomGrid = document.createElement("div");
    roomGrid.className = "roomgrid";
    roomGrid.id = "ed-rooms";
    const roomEntries = Object.entries(rooms);
    if (roomEntries.length) {
      roomEntries.forEach(([id, name]) => {
        const ordIdx = e.rooms.findIndex((r) => String(r) === String(id));
        const on = ordIdx >= 0;
        const chip = document.createElement("div");
        chip.className = `roomchip ${on ? "on" : ""}`;
        chip.dataset.rid = String(id);
        if (on) {
          const ordSpan = document.createElement("span");
          ordSpan.className = "ord";
          ordSpan.textContent = String(ordIdx + 1);
          chip.appendChild(ordSpan);
        }
        const nameSpan = document.createElement("span");
        nameSpan.textContent = String(name);
        chip.appendChild(nameSpan);

        chip.addEventListener("click", () => {
          const rid = String(id);
          const idx = e.rooms.findIndex((r) => String(r) === rid);
          if (idx >= 0) e.rooms.splice(idx, 1);
          else e.rooms.push(rid);
          this._renderEditor();
        });
        roomGrid.appendChild(chip);
      });
    } else {
      const muted = document.createElement("div");
      muted.className = "muted";
      muted.textContent = t.mapNotLoaded;
      roomGrid.appendChild(muted);
    }
    roomsField.appendChild(roomGrid);
    editorDiv.appendChild(roomsField);

    // 4. Suction field
    const sucField = document.createElement("div");
    sucField.className = "field";
    const sucLabel = document.createElement("label");
    sucLabel.textContent = t.suction;
    sucField.appendChild(sucLabel);
    const sucSelect = document.createElement("select");
    sucSelect.id = "ed-suction";
    SUCTIONS.forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = t.suctions[k] || k;
      if (e.suction === k) opt.selected = true;
      sucSelect.appendChild(opt);
    });
    sucSelect.addEventListener("change", (ev) => {
      e.suction = ev.target.value;
    });
    sucField.appendChild(sucSelect);
    editorDiv.appendChild(sucField);

    // 5. Passes field
    const passField = document.createElement("div");
    passField.className = "field";
    const passLabel = document.createElement("label");
    passLabel.textContent = t.passes;
    passField.appendChild(passLabel);
    const passSelect = document.createElement("select");
    passSelect.id = "ed-passes";
    [1, 2].forEach((val) => {
      const opt = document.createElement("option");
      opt.value = String(val);
      opt.textContent = String(val);
      if (e.passes === val) opt.selected = true;
      passSelect.appendChild(opt);
    });
    passSelect.addEventListener("change", (ev) => {
      e.passes = Number(ev.target.value);
    });
    passField.appendChild(passSelect);
    editorDiv.appendChild(passField);

    // 6. Active switch
    const activeField = document.createElement("div");
    activeField.className = "field";
    activeField.style.display = "flex";
    activeField.style.alignItems = "center";
    activeField.style.gap = "10px";
    const activeLabel = document.createElement("label");
    activeLabel.style.margin = "0";
    activeLabel.textContent = t.active;
    activeField.appendChild(activeLabel);
    const activeSwitch = document.createElement("ha-switch");
    activeSwitch.id = "ed-active";
    if (e.active) activeSwitch.setAttribute("checked", "");
    activeSwitch.addEventListener("change", (ev) => {
      e.active = ev.target.checked;
    });
    activeField.appendChild(activeSwitch);
    editorDiv.appendChild(activeField);

    // Error div
    const errDiv = document.createElement("div");
    errDiv.id = "ed-error";
    errDiv.className = "ed-error";
    editorDiv.appendChild(errDiv);

    // Action row (Cancel & Save)
    const actRow = document.createElement("div");
    actRow.className = "actrow";

    const cancelBtn = document.createElement("mwc-button");
    cancelBtn.id = "ed-cancel";
    cancelBtn.textContent = t.cancel;
    cancelBtn.addEventListener("click", () => this._closeEditor());
    actRow.appendChild(cancelBtn);

    const saveBtn = document.createElement("mwc-button");
    saveBtn.id = "ed-save";
    saveBtn.setAttribute("raised", "");
    saveBtn.textContent = e.slot >= 0 ? t.save : t.create;
    saveBtn.addEventListener("click", () => {
      const errEl = editorDiv.querySelector("#ed-error");
      if (!e.days.size) {
        if (errEl) {
          errEl.textContent = t.pickOneDay;
          errEl.style.display = "block";
        }
        this._notify(t.pickOneDay);
        return;
      }
      const roomList = (e.rooms || []).map(String);
      this._call("set_schedule", {
        slot: e.slot,
        time: e.time,
        days: Array.from(e.days).sort(),
        room_ids: roomList,
        suction: e.suction,
        passes: e.passes,
        active: e.active,
      })
        .then(() => {
          this._closeEditor();
          this._notify(t.routineSaved);
        })
        .catch((err) => {
          console.error(err);
          const msg = (err && (err.message || err.error || err)) || String(err);
          if (errEl) {
            errEl.textContent = t.errorSaving + msg;
            errEl.style.display = "block";
          }
          this._notify(t.errorSaving + msg);
        });
    });
    actRow.appendChild(saveBtn);
    editorDiv.appendChild(actRow);

    ed.appendChild(editorDiv);
    this._lastKey = null;
  }
}

if (!customElements.get("botslab-routines-card")) {
  customElements.define("botslab-routines-card", BotslabRoutinesCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "botslab-routines-card")) {
  window.customCards.push({
    type: "botslab-routines-card",
    name: "Botslab Routines",
    description: "Create and edit scheduled cleaning routines for Botslab robots",
    preview: true,
  });
}

"""Regression tests for legacy S10 live maps, using synthetic data only."""
import base64
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.botslab_vacuum.api import BotslabVacuumApi
from custom_components.botslab_vacuum.coordinator import BotslabVacuumCoordinator


@pytest.fixture
def api():
    client = BotslabVacuumApi(MagicMock(), "cn", "m2", "q", "t")
    client.get_property_extended = AsyncMock(return_value=({"WorkingStatus": "charge"}, {}))
    client.get_latest_clean_record = AsyncMock(return_value=None)
    return client


def map_doc(pixel=1):
    # One literal-only LZ4 sequence for a synthetic 4x4 raster.
    raster = bytes([0xF0, 1]) + bytes([pixel]) * 16
    return {
        "mapId": 42, "pathId": 2, "cleanId": "synthetic",
        "width": 4, "height": 4, "resolution": 0.05,
        "x_min": 0, "y_min": 0,
        "map": base64.b64encode(raster).decode(),
        "smartArea": {"value": [{"id": 1, "name": "S2l0Y2hlbg==",
                                    "vertexs": [[0, 0], [100, 0], [100, 100]]}]},
    }


@pytest.mark.asyncio
async def test_map_survives_status_and_consumables(api):
    coordinator = BotslabVacuumCoordinator(MagicMock(), MagicMock(), api)
    coordinator.async_request_refresh = AsyncMock()

    async def push(kind, data):
        await coordinator.async_on_push({"is_legacy_360": True, "sn": "test",
                                         "info_type": kind, "status": data})

    await push("20001", {"mode": "charge", "elec": 85})
    await push("20002", map_doc())
    assert api._legacy_live_status["test"]["elec"] == 85
    await push("21015", {"filter": 36000})
    await push("20001", {"mode": "charge", "elec": 84})
    await push("20002", {"mapId": 99})  # partial packet must not erase raster
    assert api._legacy_live_maps["test"] == map_doc()
    assert api._legacy_live_status["test"]["elec"] == 84
    assert api._legacy_consumables["test"]["filter"] == 36000
    doc, _ = await api.get_map_json("test", "S10")
    assert doc == map_doc()
    api.get_latest_clean_record.assert_not_awaited()
    rooms = await api.fetch_rooms("test", "S10")
    assert rooms[0].name == "Kitchen"


@pytest.mark.asyncio
async def test_legacy_record_fallback(api):
    api.get_latest_clean_record.return_value = map_doc()
    doc, _ = await api.get_map_json("test", "S10")
    assert doc == map_doc()
    api.get_latest_clean_record.assert_awaited_once_with("test")


@pytest.mark.asyncio
async def test_render_and_cache_invalidation(api):
    api._legacy_live_maps["test"] = map_doc()
    image = await api.get_live_map("test", "S10")
    assert image and image.startswith(b"\x89PNG\r\n\x1a\n")
    assert api.get_cached_map_info("test").width == 4
    old_key = api._cached_upload_id
    api._legacy_live_maps["test"] = map_doc(2)
    image = await api.get_live_map("test", "S10")
    assert image and image.startswith(b"\x89PNG")
    assert api._cached_upload_id != old_key

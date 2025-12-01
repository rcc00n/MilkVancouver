import pytest

from orders.models import Region

pytestmark = pytest.mark.django_db


def test_seeded_regions_exist():
    codes = set(Region.objects.values_list("code", flat=True))
    expected = {"north", "south", "east", "west", "center"}
    assert expected.issubset(codes)


def test_region_str_and_ordering():
    region = Region.objects.filter(code="aaa").first()
    if not region:
        region = Region.objects.create(
            code="aaa",
            name="AAA Region",
            delivery_weekday=1,
            min_orders=3,
        )
    assert "AAA Region" in str(region)
    assert "(aaa)" in str(region)

    ordered_codes = list(Region.objects.order_by("code").values_list("code", flat=True))
    assert ordered_codes == sorted(ordered_codes)

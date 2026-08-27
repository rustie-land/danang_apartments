"""Unit tests for parser.py field extractors.

Run:
    python3 -m pytest test_parser.py -v
    # or, without pytest installed:
    python3 test_parser.py

Covers: detect_currency, clean_price, extract_rooms, extract_city,
is_rental_listing, extract_contacts, extract_features.

Realistic fixtures: Vietnamese / Russian / English rental posts scraped from
Telegram channels. Known parser weaknesses are marked xfail so the suite still
passes while tracking debt.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parser as P


class TestDetectCurrency(unittest.TestCase):
    def test_thb_baht(self):
        self.assertEqual(P.detect_currency("15000 baht per month"), 'THB')
        self.assertEqual(P.detect_currency("15,000฿"), 'THB')
        self.assertEqual(P.detect_currency("бат / month"), 'THB')

    def test_usd_dollar(self):
        self.assertEqual(P.detect_currency("$500 monthly"), 'USD')
        self.assertEqual(P.detect_currency("500 usd"), 'USD')

    def test_vnd_default(self):
        self.assertEqual(P.detect_currency("12 triệu"), 'VND')
        self.assertEqual(P.detect_currency("аренда квартиры"), 'VND')
        self.assertEqual(P.detect_currency(""), 'VND')


class TestCleanPrice(unittest.TestCase):
    def test_vnd_million_suffix(self):
        vnd_m, cur = P.clean_price("Price: 12.5 million VND/month")
        self.assertEqual(cur, 'VND')
        self.assertAlmostEqual(vnd_m, 12.5, places=1)

    def test_vnd_trieu(self):
        vnd_m, cur = P.clean_price("Giá 12 triệu")
        self.assertEqual(cur, 'VND')
        self.assertAlmostEqual(vnd_m, 12.0, places=1)

    def test_vnd_full_number(self):
        vnd_m, cur = P.clean_price("Rental price: 19,000,000 VND/month")
        self.assertEqual(cur, 'VND')
        self.assertAlmostEqual(vnd_m, 19.0, places=1)

    def test_usd(self):
        vnd_m, cur = P.clean_price("$500 / month")
        self.assertEqual(cur, 'USD')
        # 500 USD * 25000 / 1e6 = 12.5M VND
        self.assertAlmostEqual(vnd_m, 12.5, places=1)

    def test_thb(self):
        vnd_m, cur = P.clean_price("15000฿ / month")
        self.assertEqual(cur, 'THB')
        # 15000 THB * 700 / 1e6 = 10.5M VND
        self.assertAlmostEqual(vnd_m, 10.5, places=1)

    def test_empty(self):
        vnd_m, cur = P.clean_price("")
        self.assertEqual((vnd_m, cur), (0.0, 'VND'))

    def test_vnd_tr_short(self):
        vnd_m, cur = P.clean_price("15tr/month")
        self.assertAlmostEqual(vnd_m, 15.0, places=1)


class TestExtractRooms(unittest.TestCase):
    def test_one_bedroom(self):
        self.assertEqual(P.extract_rooms("1 Bedroom apartment for rent"), 1)

    def test_three_br(self):
        self.assertEqual(P.extract_rooms("3 BR condo"), 3)

    def test_studio(self):
        self.assertEqual(P.extract_rooms("Cozy studio near beach"), 0)

    def test_russian_spalen(self):
        self.assertEqual(P.extract_rooms("2-спальня квартира"), 2)

    @unittest.expectedFailure
    def test_russian_komnatnaya(self):
        # "2-комнатная" (no 'спальн') currently returns default 1 — gap
        self.assertEqual(P.extract_rooms("2-комнатная квартира"), 2)

    def test_default_fallback(self):
        self.assertEqual(P.extract_rooms("Nice apartment"), 1)


class TestExtractCity(unittest.TestCase):
    def test_from_text(self):
        self.assertEqual(P.extract_city("Apartments in Da Nang"), 'Da Nang')

    def test_from_channel_title(self):
        self.assertEqual(P.extract_city("", "Недвижимость Паттайя"), 'Pattaya')

    def test_russian(self):
        self.assertEqual(P.extract_city("Аренда Пхукет"), 'Phuket')

    def test_other(self):
        self.assertEqual(P.extract_city("Some random text"), 'Other')

    def test_priority_text_over_title(self):
        self.assertEqual(P.extract_city("Da Nang listing", "Pattaya channel"), 'Da Nang')


class TestIsRentalListing(unittest.TestCase):
    def test_rental_ok(self):
        self.assertTrue(P.is_rental_listing("Apartment for rent in Da Nang, 2 bedrooms"))

    def test_sale_rejected(self):
        self.assertFalse(P.is_rental_listing("Купить квартиру Пхукет инвестиции"))

    def test_invest_rejected(self):
        self.assertFalse(P.is_rental_listing("Invest in Patong condos, high ROI"))

    def test_district_list_rejected(self):
        self.assertFalse(P.is_rental_listing(
            "Список районов t.me/a t.me/b t.me/c район"))

    def test_no_rent_signal_rejected(self):
        self.assertFalse(P.is_rental_listing("Just a photo of the beach"))


class TestExtractContacts(unittest.TestCase):
    def test_telegram(self):
        c = P.extract_contacts("Contact @owner_agent please")
        self.assertIn('@owner_agent', c)

    def test_phone(self):
        c = P.extract_contacts("Call +84901234567")
        self.assertIn('+84901234567', c)

    def test_none(self):
        self.assertEqual(P.extract_contacts("No contacts here"), "Direct TG Message")


class TestExtractFeatures(unittest.TestCase):
    def test_pool_balcony(self):
        feats = P.extract_features("Swimming pool and private balcony, near beach")
        self.assertIn('#pool', feats)
        self.assertIn('#balcony', feats)
        self.assertIn('#beach', feats)

    def test_ac_russian(self):
        feats = P.extract_features("Кондиционер и кухня")
        self.assertIn('#ac', feats)
        self.assertIn('#kitchen', feats)

    def test_empty(self):
        self.assertEqual(P.extract_features("Nothing special"), [])


if __name__ == '__main__':
    unittest.main(verbosity=2)

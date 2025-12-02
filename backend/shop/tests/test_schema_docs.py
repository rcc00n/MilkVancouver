from django.test import TestCase
from django.urls import reverse


class SchemaDocsTests(TestCase):
    def test_schema_endpoint_returns_openapi_document(self):
        response = self.client.get(reverse("schema"))
        self.assertEqual(response.status_code, 200)
        import yaml

        body = yaml.safe_load(response.content.decode())
        self.assertIn("openapi", body)

    def test_swagger_ui_served_as_html(self):
        response = self.client.get(reverse("swagger-ui"))
        self.assertEqual(response.status_code, 200)
        content_type = response.headers.get("Content-Type", "")
        self.assertIn("html", content_type.lower())

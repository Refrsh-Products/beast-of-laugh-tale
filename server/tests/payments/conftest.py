from unittest.mock import patch

import pytest


@pytest.fixture
def mock_gateway():
    """Patch ``payments.views.get_payment_gateway`` and yield the mocked gateway.

    The gateway's ``create_invoice`` is pre-stubbed to return a fake checkout
    URL and invoice id, so tests can exercise the payment views without hitting
    the real payment provider. Tests can override the return value or assert on
    calls via the yielded mock.
    """
    with patch("payments.views.get_payment_gateway") as mock_get_gateway:
        gateway = mock_get_gateway.return_value
        gateway.create_invoice.return_value = {
            "payment_url": "https://pay.example/checkout/abc",
            "invoice_id": "inv_test_123",
        }
        yield gateway
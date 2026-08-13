import logging
import requests
from django.conf import settings


logger = logging.getLogger(__name__)


ZINIPAY_CREATE_URL = 'https://api.zinipay.com/v1/payment/create'
ZINIPAY_VERIFY_URL = 'https://api.zinipay.com/v1/payment/verify'

# Trigger values — pass these as `referral_code` (or a dedicated `mock_scenario` field,
# see serializer note below) to control mock behavior in local testing.
MOCK_SCENARIO_FAIL_CREATE = 'MOCK_FAIL_CREATE'      # create_invoice raises RequestException
MOCK_SCENARIO_FAIL_VERIFY = 'MOCK_FAIL_VERIFY'      # verify_invoice raises RequestException
MOCK_SCENARIO_PAYMENT_FAILED = 'MOCK_PAYMENT_FAILED'  # verify returns status=FAILED
MOCK_SCENARIO_PENDING = 'MOCK_PENDING'              # verify returns status=PENDING
MOCK_SCENARIO_UNKNOWN = 'MOCK_UNKNOWN_STATUS'       # verify returns an unrecognized status


class ZiniPayGateway:
    def create_invoice(self, payload: dict) -> dict:
        response = requests.post(
            ZINIPAY_CREATE_URL,
            json=payload,
            headers={
                'zini-api-key': settings.ZINIPAY_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    
    def verify_invoice(self, invoice_id: str) -> dict:
        """
        Success response:
            {
             "cus_name": "John Doe",
             "cus_email": "john@example.com",
             "amount": 1200,
             "invoice_id": "INVOICE_ID",
             "payment_method": "bkash",
             "transaction_id": "TXN123456789",
             "status": "COMPLETED"
            }
        """

        response = requests.post(
            ZINIPAY_VERIFY_URL,
            json={'invoice_id': invoice_id},
            headers={'zini-api-key': settings.ZINIPAY_API_KEY, 'Content-Type': 'application/json'},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    

class MockZiniPayGateway:
    """
    Mock gateway for local/dev testing. Encodes the desired test scenario
    into the invoice_id itself, so verify_invoice can later replay the same
    scenario without needing shared/persisted state.
    """

    SCENARIOS = {
        MOCK_SCENARIO_FAIL_CREATE,
        MOCK_SCENARIO_FAIL_VERIFY,
        MOCK_SCENARIO_PAYMENT_FAILED,
        MOCK_SCENARIO_PENDING,
        MOCK_SCENARIO_UNKNOWN,
    }

    def _scenario_from_payload(self, payload: dict) -> str:
        scenario = payload.get('metadata', {}).get('mock_scenario', '')
        return scenario if scenario in self.SCENARIOS else ''

    def create_invoice(self, payload: dict) -> dict:
        scenario = self._scenario_from_payload(payload)

        if scenario == MOCK_SCENARIO_FAIL_CREATE:
            raise requests.RequestException("Mock: simulated create-invoice failure")

        val_id = payload['val_id']
        # Encode scenario into invoice_id so verify_invoice can decode it later
        invoice_id = f"mock_inv_{val_id}::{scenario or 'SUCCESS'}"

        return {
            'payment_url': f"{settings.FRONTEND_URL}/payment/mock-success?invoice_id={invoice_id}&val_id={val_id}",
            'invoice_id': invoice_id,
        }
    
    def verify_invoice(self, invoice_id: str) -> dict:
        # Decode scenario back out of the invoice_id we generated
        parts = invoice_id.rsplit('::', 1)
        scenario = parts[-1] if len(parts) == 2 else 'SUCCESS'

        if scenario == MOCK_SCENARIO_FAIL_VERIFY:
            raise requests.RequestException("Mock: simulated verify failure")

        status_map = {
            MOCK_SCENARIO_PAYMENT_FAILED: 'FAILED',
            MOCK_SCENARIO_PENDING: 'PENDING',
            MOCK_SCENARIO_UNKNOWN: 'SOME_UNKNOWN_STATUS',
        }
        verified_status = status_map.get(scenario, 'COMPLETED')

        return {
            'status': verified_status,
            'transaction_id': f"mock_txn_{invoice_id}",
            'invoice_id': invoice_id,
            'payment_method': 'mock_card',
        }


def get_payment_gateway():
    if settings.USE_MOCK_PAYMENT_GATEWAY:
        return MockZiniPayGateway()
    return ZiniPayGateway()
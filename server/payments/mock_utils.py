from django.test import RequestFactory


def simulate_webhook_callback(invoice_id: str, val_id: str):
    """
    Dev-only: synchronously invokes the webhook view in-process, as if
    ZiniPay had called it, so the full create -> verify -> upgrade flow
    can be exercised locally without any real network calls.
    """
    from .views import ZiniPayWebhookView
    factory = RequestFactory()
    request = factory.get(f'/api/payments/webhook/?invoice_id={invoice_id}&val_id={val_id}')
    response = ZiniPayWebhookView.as_view()(request)
    response.render() if hasattr(response, 'render') else None # type: ignore
    return response
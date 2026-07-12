import json

from rest_framework.renderers import BaseRenderer


class ServerSentEventRenderer(BaseRenderer):
    """Lets DRF content negotiation accept `Accept: text/event-stream`.

    EventSource clients (mobile's react-native-sse) send that Accept header, and
    without a matching renderer DRF's `initial()` 406s before the view runs. The
    happy path returns a StreamingHttpResponse, which bypasses DRF rendering
    entirely — this renderer only actually renders error Responses (400/403/404),
    which it emits as JSON so clients can still read the error detail.
    """

    media_type = "text/event-stream"
    format = "sse"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        if isinstance(data, bytes):
            return data
        if isinstance(data, str):
            return data.encode("utf-8")
        return json.dumps(data).encode("utf-8")

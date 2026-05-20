from pythonjsonlogger.json import JsonFormatter


class DozzleJsonFormatter(JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        if record.exc_info:
            log_record['traceback'] = self.formatException(record.exc_info).splitlines()
            log_record.pop('exc_info', None)
        if record.stack_info:
            log_record['stack'] = self.formatStack(record.stack_info).splitlines()
            log_record.pop('stack_info', None)

from terminaltables import (
    AsciiTable,
)

def print_dict(d, precision=2):
    table_data = [
        ["Key", "Value"],
        *[[key, f"{value:.{precision}f}"] for key, value in d.items()]
    ]
    table = AsciiTable(table_data)
    print(table.table)

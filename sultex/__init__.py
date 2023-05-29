# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import frappe
from erpnext.accounts.doctype.accounting_dimension.accounting_dimension import get_accounting_dimensions, get_dimension_with_children
from erpnext.accounts.report.accounts_receivable.accounts_receivable import ReceivablePayableReport


__version__ = '0.0.1'

# Monkey patching for fix of erpnext accounting dimension filters in reports


def add_accounting_dimensions_filters(self, conditions, values):
    accounting_dimensions = get_accounting_dimensions(as_list=False)

    if accounting_dimensions:
        for dimension in accounting_dimensions:
            if self.filters.get(dimension.fieldname):
                if frappe.get_cached_value('DocType', dimension.document_type, 'is_tree'):
                    self.filters[dimension.fieldname] = get_dimension_with_children(
                        dimension.document_type, self.filters.get(dimension.fieldname))

                # fix is in below lines
                conditions.append("{0} = %s".format(dimension.fieldname))
                values.append(self.filters.get(dimension.fieldname))


ReceivablePayableReport.add_accounting_dimensions_filters = add_accounting_dimensions_filters

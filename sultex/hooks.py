# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "sultex"
app_title = "Sultex"
app_publisher = "Havenir Solutions pvt Limited"
app_description = "Sultex"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "info@havenir.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/sultex/css/sultex.css"
# app_include_js = "/assets/sultex/js/sultex.js"

# include js, css files in header of web template
# web_include_css = "/assets/sultex/css/sultex.css"
# web_include_js = "/assets/sultex/js/sultex.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Work Order": "public/js/work_order.js",
    "BOM": "public/js/bom.js",
    "Stock Entry": "public/js/stock_entry.js",
    "Purchase Order": "public/js/purchase_order.js",
    "Purchase Receipt": "public/js/purchase_receipt.js",
    "Purchase Invoice": "public/js/purchase_invoice.js",
    "Payment Entry": "public/js/payment_entry.js",
    "Delivery Note": "public/js/delivery_note.js",
    "Purchase Order": "public/js/purchase_order.js",
    "Sales Invoice": "public/js/sales_invoice.js",
    "Sales Order": "public/js/sales_order.js"
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "sultex.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "sultex.install.before_install"
# after_install = "sultex.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "sultex.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    # 	"*": {
    # 		"on_update": "method",
    # 		"on_cancel": "method",
    # 		"on_trash": "method"
    #	}
    "Work Order": {
        "validate": "sultex.events.work_order.validate",
        "on_submit":"sultex.events.work_order.submit"
    },
    "Stock Entry": {
        "on_submit": "sultex.events.stock_entry.secondary_qty",
        "on_cancel": "sultex.events.stock_entry.cancel"
    },
    "Delivery Note": {
        "validate": "sultex.events.delivery_note.validate"
    },
    "Payment Entry": {
        "validate": "sultex.events.payment_entry.validate_chq",
        "before_save":"sultex.events.payment_entry.set_net_total",
        #"on_submit": "sultex.events.payment_entry.set_bill_details"
    }
    ,
    "Journal Entry": {
        "validate": "sultex.events.journal_entry.validate_chq"
    },
    "Purchase Invoice":{
        "before_save": "sultex.events.purchase_order.get_tac",
        "on_submit": "sultex.events.purchase_invoice.post_jv"
    }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"sultex.tasks.all"
# 	],
# 	"daily": [
# 		"sultex.tasks.daily"
# 	],
# 	"hourly": [
# 		"sultex.tasks.hourly"
# 	],
# 	"weekly": [
# 		"sultex.tasks.weekly"
# 	]
# 	"monthly": [
# 		"sultex.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "sultex.install.before_tests"

# Overriding Methods
# ------------------------------
#
override_whitelisted_methods = {
 	"erpnext.accounts.doctype.payment_entry.payment_entry.get_reference_details": "sultex.events.payment_entry.get_reference_details"
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "sultex.task.get_dashboard_data"
# }

fixtures = [
    {
        "dt": "Property Setter",
        "filters": [["name", "in", [
            'Work Order Item-item_code-columns',
            'Work Order Item-source_warehouse-columns',
            'Work Order Item-required_qty-columns',
            'Work Order Item-transferred_qty-columns',
            'Work Order Item-consumed_qty-columns',
            'Payment Entry-paid_amount-depends_on',
            "Sales Invoice Item-item_code-columns",
        ]]]},
    {
        "dt": "Custom Field",
        "filters": [["name", "in", [
            # Stock Entry
            "Stock Entry-secondary_quantity",
            "Secondary Quantity UOM",
            'Stock Entry-required_date',
            'Supplier-purchase_taxes_and_charges_template',
            # Work Order
            "Work Order-secondary_uom_qty",
            "Work Order-work_order_secondary_uom",
            "Work Order-dynamic_work_order",
            'Work Order-tracking_number',
            "Work Order-from_work_order",
            "Work Order-custom_stock_uom",
            "Work Order-reference_work_order",
            # Work Order Item
            "Work Order Item-item_allocated",
            'Work Order Item-uom',
            # BOM 
            'BOM-greige_dept_product_id',
            # BOM Item
            'BOM Item-item_group',
            # BOM Explosion Item
            'BOM Explosion Item-uom',
            # Purchase Order
            'Purchase Order-target_delivery_date',
            'Purchase Order-broker',
            'Purchase Order-broker_name',
            # Purchase Order Item
            'Purchase Order Item-seconday_uom_and_qty',
            'Purchase Order Item-secondary_uom',
            'Purchase Order Item-secondary_conversion_factor',
            'Purchase Order Item-column_break_31',
            'Purchase Order Item-secondary_rate',
            'Purchase Order Item-secondary_qty',

            # Purchase Invoice
            'Purchase Invoice-broker',
            'Purchase Invoice-broker_name',
            # Purchase Invoice Item
            'Purchase Invoice Item-seconday_uom_and_qty',
            'Purchase Invoice Item-secondary_uom',
            'Purchase Invoice Item-secondary_conversion_factor',
            'Purchase Invoice Item-column_break_26',
            'Purchase Invoice Item-secondary_rate',
            'Purchase Invoice Item-secondary_qty',
            # Item
            'Item-parent_group',
            "Item-tare_weight",
            'Item-net_weight_per_unit',
            'Item-gross_weight_per_unit',
            'Item-terms_and_conditions',

            # Purchase Receipt
            'Purchase Receipt-broker',
            'Purchase Receipt-broker_name',
            # Purchase Receipt Item
            "Purchase Receipt Item-tare_weight",
            "Purchase Receipt Item-bilty_weight",
            "Purchase Receipt Item-net_qty_received",
            "Purchase Receipt Item-total_tare_weight",
            'Purchase Receipt Item-seconday_uom_and_qty',
            'Purchase Receipt Item-secondary_conversion_factor',
            "Purchase Receipt Item-secondary_uom",
            'Purchase Receipt Item-column_break_39',
            'Purchase Receipt Item-secondary_rate',
            'Purchase Receipt Item-secondary_qty',
            # Payment Entry
            "Payment Entry-withholding_tax_category",
            'Payment Entry-net_amount',
            # Delivery Note Item
            'Delivery Note Item-net_weight_per_unit',
            'Delivery Note Item-gross_weight_per_unit',
            'Delivery Note Item-total_net_weight',
            'Delivery Note Item-total_gross_weight',
            'Delivery Note Item-remarks',
            'Delivery Note Item-from_pkg_no',
            'Delivery Note Item-to_pkg_no',
            'Delivery Note Item-secondary_qty',
            'Delivery Note Item-column_break_29',
            'Delivery Note Item-secondary_uom',
            'Delivery Note Item-secondary_conversion_factor',
            'Delivery Note Item-secondary_qty_2',
            'Delivery Note Item-secondary_uom_2',
            'Delivery Note Item-secondary_conversion_factor_2',
            'Delivery Note Item-customer_purchase_order_no',
            # Delivery Note
            'Delivery Note-section_break_15',
            'Delivery Note-contract_letter_of_credit_goods',
            'Delivery Note-bl_no',
            'Delivery Note-column_break_18',
            'Delivery Note-total_gross_weight',
            'Delivery Note-contract_dated',
            'Delivery Note-total_secondary_qty',
            'Delivery Note-bl_dated',
            'Delivery Note-total_secondary_qty_2',
            "Delivery Note-sales_order",
            "Delivery Note Item-delivery_date",
            # Sales Invoice
            'Sales Invoice-letter_of_credit_no_and_bill_no',
            'Sales Invoice-contract_letter_of_credit_goods',
            'Sales Invoice-column_break_19',
            'Sales Invoice-contract_dated',
            'Sales Invoice-bl_no',
            'Sales Invoice-bl_date',
            'Sales Invoice-form_e_date',
            'Sales Invoice-form_e_date',
            'Sales Invoice-vessel',
            'Sales Invoice-voy',
            'Sales Invoice-description',
            'Sales Invoice-section_break_29',
            'Sales Invoice-mode_of_shipment',
            'Sales Invoice-port_of_loading',
            'Sales Invoice-place_of_delivery',
            'Sales Invoice-bill_of_lading',
            'Sales Invoice-account_and_risk_meassures',
            'Sales Invoice-bill_of_lading_date',
            'Sales Invoice-against_contract_letter_of_credit_no',
            'Sales Invoice-drawn_at_120_days',
            'Sales Invoice-through_bank',
            'Sales Invoice-contract_date',
            'Sales Invoice-drawn_at_120_days_days',
            'Sales Invoice-sales_invoice_custom_column_break1',
            'Sales Invoice-sales_invoice_custom_column_break',
            'Sales Invoice-port_of_discharge',
            'Sales Invoice-total_secondary_quantity',
            'Sales Invoice-total_secondary_quantity_2',

            'Sales Invoice Item-secondary_qty',
            'Sales Invoice Item-secondary_conversion_factor',
            'Sales Invoice Item-secondary_uom',
            'Sales Invoice Item-customer_purchase_order_no',
            'Sales Order Item-customer_purchase_order_no',
            'Sales Invoice Item-secondary_uom_2',
            'Sales Invoice Item-secondary_qty_2',
            'Sales Invoice Item-secondary_conversion_factor_2',
            "Sales Invoice Item-gross_weight",
            "Sales Invoice Item-net_weight",
            "Sales Invoice-items_gross_weight",
            "Sales Invoice-items_net_weight",
            "Sales Invoice-sales_order",
            "Sales Invoice Item-delivery_date",
        ]]]},
    {
        "dt": "Accounting Dimension",
        "filters": [
            [
                "name", "in",
                [
                    "Broker",
                    # Delivery Note Item
                    "Delivery Note Item-rate-in_list_view",
                    'Delivery Note Item-amount-in_list_view',
                    'Delivery Note Item-qty-width',
                    'Delivery Note Item-qty-print_width',
                    'Delivery Note Item-qty-columns',
                    'Delivery Note Item-uom-columns',
                    'Delivery Note Item-item_code-columns',
                ]
            ]
        ]
    }
]

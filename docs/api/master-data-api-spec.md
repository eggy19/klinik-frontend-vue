# Master Data API Specification

Version: 1.0
Module: Inventory & Pharmacy Service
Status: MVP Locked
Architecture: REST API

---

# 1. Overview

Dokumen ini mendefinisikan API Endpoint untuk seluruh Master Data pada Inventory & Pharmacy Service.

Scope MVP saat ini difokuskan untuk:

* Apotek
* Inventory Management
* Purchasing
* OTC Sales
* Stock Management

Clinical Module akan ditambahkan pada fase berikutnya.

---

# 2. Base URL

```http
/api/v1/master
```

---

# 3. Common Headers

```http
Authorization: Bearer {token}
Content-Type: application/json
X-Tenant-Id: {tenant_id}
X-Branch-Id: {branch_id}
```

---

# 4. Standard Response

## Success

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": []
}
```

---

# 5. Item Type API

Resource:

```text
master_item_type
```

---

## Get All Item Types

```http
GET /master/item-types
```

---

## Get Item Type By Id

```http
GET /master/item-types/{id}
```

---

## Create Item Type

```http
POST /master/item-types
```

Request:

```json
{
  "code": "MED",
  "name": "Medicine",
  "description": "Medicine Product"
}
```

---

## Update Item Type

```http
PUT /master/item-types/{id}
```

---

## Delete Item Type

```http
DELETE /master/item-types/{id}
```

Business Rule:

* Tidak boleh dihapus jika sudah digunakan Category.

---

# 6. Category API

Resource:

```text
master_category
```

---

## Get Categories

```http
GET /master/categories
```

Query Params:

```http
?page=1
&limit=20
&search=anti
&itemTypeId=uuid
```

---

## Get Category By Id

```http
GET /master/categories/{id}
```

---

## Create Category

```http
POST /master/categories
```

Request:

```json
{
  "itemTypeId": "uuid",
  "categoryCode": "ANTB",
  "categoryName": "Antibiotik",
  "description": "Kategori Antibiotik"
}
```

---

## Update Category

```http
PUT /master/categories/{id}
```

---

## Delete Category

```http
DELETE /master/categories/{id}
```

Business Rule:

* Tidak boleh dihapus jika sudah digunakan Item.

---

# 7. Unit API

Resource:

```text
master_unit
```

---

## Get Units

```http
GET /master/units
```

---

## Get Unit By Id

```http
GET /master/units/{id}
```

---

## Create Unit

```http
POST /master/units
```

Request:

```json
{
  "unitCode": "TAB",
  "unitName": "Tablet",
  "description": "Tablet"
}
```

---

## Update Unit

```http
PUT /master/units/{id}
```

---

## Delete Unit

```http
DELETE /master/units/{id}
```

Business Rule:

* Tidak boleh dihapus jika sudah digunakan Item.

---

# 8. Supplier API

Resource:

```text
master_supplier
```

---

## Get Suppliers

```http
GET /master/suppliers
```

Query Params:

```http
?page=1
&limit=20
&search=kimia
```

---

## Get Supplier By Id

```http
GET /master/suppliers/{id}
```

---

## Create Supplier

```http
POST /master/suppliers
```

Request:

```json
{
  "supplierCode": "SUP001",
  "supplierName": "Kimia Farma",
  "phone": "08123456789",
  "email": "sales@supplier.com",
  "address": "Jakarta"
}
```

---

## Update Supplier

```http
PUT /master/suppliers/{id}
```

---

## Delete Supplier

```http
DELETE /master/suppliers/{id}
```

Business Rule:

* Tidak boleh dihapus jika sudah digunakan transaksi Purchasing.

---

# 9. Item API

Resource:

```text
master_item
item_supplier
master_item_price
master_item_unit
item_unit_conversion
```

---

## Get Items

```http
GET /master/items
```

Query Params:

```http
?page=1
&limit=20
&search=paracetamol
&categoryId=uuid
&supplierId=uuid
&isActive=true
```

---

## Get Item Detail

```http
GET /master/items/{id}
```

Response:

```json
{
  "id": "uuid",
  "itemCode": "MED000001",
  "itemName": "Paracetamol 500mg",
  "barcode": "8991234567890",

  "itemType": {},
  "category": {},

  "defaultUnit": {},

  "minimumStock": 50,
  "reorderPoint": 100,

  "trackBatch": true,
  "trackExpiry": true,

  "prescriptionRequired": false,

  "suppliers": [],
  "prices": [],
  "conversions": []
}
```

---

## Create Item

```http
POST /master/items
```

Request:

```json
{
  "itemCode": "MED000001",
  "itemName": "Paracetamol 500mg",

  "itemTypeId": "uuid",
  "categoryId": "uuid",

  "defaultUnitId": "uuid",

  "barcode": "8991234567890",

  "manufacturer": "Kimia Farma",

  "minimumStock": 50,
  "maximumStock": 1000,
  "reorderPoint": 100,

  "trackBatch": true,
  "trackExpiry": true,

  "prescriptionRequired": false,

  "suppliers": [
    {
      "supplierId": "uuid",
      "isPrimary": true
    }
  ],

  "prices": [
    {
      "unitId": "uuid",
      "purchasePrice": 500,
      "sellingPrice": 1000
    }
  ],

  "conversions": [
    {
      "fromUnitId": "BOX",
      "toUnitId": "STRIP",
      "factor": 10
    },
    {
      "fromUnitId": "STRIP",
      "toUnitId": "TABLET",
      "factor": 10
    }
  ]
}
```

---

## Update Item

```http
PUT /master/items/{id}
```

Business Rule:

* Item Code tidak boleh diubah setelah tersimpan.

---

## Deactivate Item

```http
PATCH /master/items/{id}/deactivate
```

---

## Activate Item

```http
PATCH /master/items/{id}/activate
```

---

## Delete Item

```http
DELETE /master/items/{id}
```

Business Rule:

* Item yang sudah digunakan transaksi tidak boleh dihapus.
* Gunakan deactivate.

---

# 10. Lookup API

Digunakan untuk dropdown dan master reference.

---

## Master Lookup

```http
GET /master/lookups
```

Response:

```json
{
  "itemTypes": [],
  "categories": [],
  "units": [],
  "suppliers": []
}
```

Tujuan:

* Mengurangi jumlah API Call frontend.
* Mempercepat rendering form.

---

# 11. Pagination Format

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

---

# 12. Validation Rules

## Item

* itemCode wajib unik per tenant
* itemName wajib diisi
* categoryId wajib diisi
* defaultUnitId wajib diisi

---

## Unit Conversion

* factor minimal 1
* tidak boleh circular conversion

Contoh:

```text
BOX -> STRIP
STRIP -> TABLET
```

Valid.

---

## Batch Rule

Jika:

```text
trackExpiry = true
```

Maka:

```text
trackBatch = true
```

---

## Prescription Rule

Jika:

```text
prescriptionRequired = true
```

Maka item tidak boleh dijual melalui OTC Sales.

---

# 13. MVP Scope

API yang termasuk MVP:

* Item Type
* Category
* Unit
* Supplier
* Item
* Lookup

API yang ditunda:

* Manufacturer Master
* Rack Master
* Warehouse Master
* Tax Master
* Price History
* Stock Alert
* Audit Log API

Status:

```text
LOCKED FOR MVP
```

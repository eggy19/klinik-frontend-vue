# Component Standard

## Base Components

### BaseButton

Props

* label
* icon
* variant
* size
* loading
* disabled

Variants

* primary
* secondary
* success
* warning
* danger
* ghost

---

### BaseCard

Digunakan untuk:

* Dashboard
* Form Container
* Summary Widget

---

### BaseInput

Standar seluruh text input.

---

### BaseSelect

Standar seluruh dropdown.

---

### BaseDialog

Digunakan untuk:

* Create
* Edit
* Confirmation

---

### BaseToast

Digunakan untuk:

* Success Notification
* Error Notification
* Warning Notification

---

### BaseDataTable

Fitur wajib:

* Search
* Pagination
* Sorting
* Export CSV
* Loading State
* Empty State
* Column Visibility
* Row Action

BaseDataTable menjadi standar seluruh tabel dalam aplikasi.

Tidak diperbolehkan membuat tabel custom tanpa alasan yang jelas.

---

## Component Naming

Good

BaseButton.vue

BaseInput.vue

MedicineForm.vue

SupplierTable.vue

Avoid

Button1.vue

MyTable.vue

CustomInput.vue

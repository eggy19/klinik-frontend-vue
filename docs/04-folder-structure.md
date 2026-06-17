# Folder Structure

src/
├── api/
├── assets/
├── components/
│
├── layouts/
│
├── modules/
│   ├── inventory/
│   ├── supplier/
│   ├── purchasing/
│   └── stock-ledger/
│
├── router/
│
├── stores/
│
├── styles/
│   ├── tokens/
│   ├── themes/
│   └── main.scss
│
├── types/
│
└── utils/

---

# Module Structure

inventory/
│
├── api/
├── components/
├── stores/
├── types/
└── views/

---

# Shared Components

components/base/
│
├── BaseButton.vue
├── BaseCard.vue
├── BaseInput.vue
├── BaseSelect.vue
├── BaseDialog.vue
└── BaseDataTable.vue

---

# Styles Structure

styles/
│
├── tokens/
│   ├── colors.scss
│   ├── spacing.scss
│   ├── radius.scss
│   ├── shadows.scss
│   └── typography.scss
│
├── themes/
│   ├── light.scss
│   └── dark.scss
│
└── main.scss

# UI / UX Standard

## Purpose

Dokumen ini mendefinisikan standar tampilan dan pengalaman pengguna untuk seluruh Healthcare SaaS Platform.

Target:

* Modern
* Clean
* Enterprise
* Fast
* Easy to Learn

Referensi visual:

* Mekari Talenta
* Mekari Jurnal
* Xendit Dashboard
* Stripe Dashboard
* Linear
* Notion

---

# Design Philosophy

## Functional First

Aplikasi digunakan oleh:

* Admin
* Apoteker
* Kasir
* Dokter

Prioritas:

1. Cepat digunakan
2. Mudah dipahami
3. Konsisten

Bukan estetika berlebihan.

---

# Visual Style

## Theme

Light Mode

Default.

Dark Mode

Optional.

---

## Border Radius

Gunakan:

10px

Hindari:

* radius 0
* radius terlalu besar

---

## Shadow

Gunakan shadow ringan.

Card harus terlihat terpisah dari background.

Hindari shadow berat.

---

# Typography

Font:

Inter

Heading:

600

Body:

400

---

# Layout Standard

## Sidebar

Width:

260px

Collapsed:

72px

---

## Header

Height:

64px

Sticky.

---

## Content Area

Padding:

24px

---

# Card Standard

Digunakan untuk:

* Dashboard Widget
* Form Container
* Information Block

Style:

* Rounded
* Light Shadow
* White Surface

---

# Table Standard

Table merupakan komponen utama sistem.

Target:

20–30 row terlihat dalam satu layar desktop.

---

## Row Height

44px

---

## Header Height

48px

---

## Hover

Background subtle.

---

## Search

Posisi:

Kiri atas.

---

## Action

Posisi:

Kanan.

---

## Pagination

Posisi:

Kanan bawah.

---

# Form Standard

## Label Position

Label selalu di atas field.

Good

Nama Obat

[input]

Avoid

Nama Obat : [input]

---

## Required Field

Gunakan:

*

Contoh:

Nama Obat *

---

## Error Message

Ditampilkan langsung di bawah field.

---

# Dialog Standard

Digunakan untuk:

* Create
* Edit
* Delete Confirmation

---

# Loading Standard

Gunakan Skeleton Loader.

Avoid:

Loading...

---

# Empty State

Harus memiliki:

* Icon
* Description
* Action

Contoh:

Belum ada data obat

[Tambah Obat]

---

# Notification Standard

Gunakan Toast.

Success

Data berhasil disimpan.

Error

Gagal menyimpan data.

Warning

Periksa kembali data Anda.

---

# UX Rules

## Delete

Wajib confirmation.

---

## Save

Tampilkan feedback.

---

## Long Process

Gunakan loading indicator.

---

## Search

Debounce minimal 300ms.

---

# Dashboard Standard

Maksimal:

4 sampai 6 summary card.

Contoh:

* Total Item
* Low Stock
* Near Expired
* Today Transaction

---

# Accessibility

Minimal:

* Keyboard Navigation
* Focus State
* Contrast AA
* Screen Reader Friendly

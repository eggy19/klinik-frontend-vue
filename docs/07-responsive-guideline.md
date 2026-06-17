# 07-responsive-guideline.md

# Responsive Guideline

## Purpose

Dokumen ini mendefinisikan standar responsive untuk seluruh aplikasi.

---

# Device Priority

Healthcare SaaS adalah desktop-first application.

Prioritas:

1. Desktop
2. Laptop
3. Tablet
4. Mobile

---

# Breakpoint Standard

Mobile

0px - 767px

Tablet

768px - 1023px

Laptop

1024px - 1439px

Desktop

1440px+

---

# Layout Behaviour

## Desktop

Sidebar selalu tampil.

---

## Tablet

Sidebar collapse.

---

## Mobile

Sidebar menjadi drawer.

---

# Table Behaviour

Desktop

Full Table.

---

Tablet

Horizontal Scroll.

---

Mobile

Card View atau Horizontal Scroll.

---

# Form Behaviour

Desktop

2 column atau 3 column.

---

Tablet

2 column.

---

Mobile

1 column.

---

# Dashboard Behaviour

Desktop

4 card per row.

---

Laptop

3 card per row.

---

Tablet

2 card per row.

---

Mobile

1 card per row.

---

# Grid Standard

Gunakan:

grid-cols-12

Sebagai standar utama.

---

# Page Width

Maksimal:

1600px

Agar tampilan tetap nyaman pada monitor besar.

---

# Responsive Images

Gunakan:

max-width: 100%

---

# Responsive Dialog

Desktop

600px - 900px

---

Mobile

95% viewport width

---

# Touch Target

Button minimal:

40px

Direkomendasikan:

44px

---

# Mobile Rules

Target mobile hanya:

* Tidak rusak
* Tetap bisa digunakan

Tidak wajib memiliki pengalaman setara desktop pada MVP.

---

# Performance Rules

Lazy Loading wajib untuk:

* Route
* Large Module

---

# Responsive Testing

Minimal diuji pada:

1366x768

1440x900

1920x1080

768x1024

390x844

---

# MVP Standard

Jika tampilan memenuhi:

* Desktop optimal
* Tablet usable
* Mobile tidak rusak

Maka dianggap memenuhi standar MVP.

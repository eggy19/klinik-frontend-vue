# Goods Receipt UI/UX Design Specification
## Modul: Purchasing → Goods Receipt
Version: 2.0
Status: Recommended

---

# 1. Objective

Dokumen ini mendefinisikan standar tampilan (UI), pengalaman pengguna (UX), serta batasan informasi yang ditampilkan pada modul **Goods Receipt (Penerimaan Barang)**.

Tujuan utama redesign ini adalah:

- Mengurangi kebingungan user terhadap informasi harga beli dan harga jual.
- Memisahkan informasi transaksi pembelian dengan informasi pricing.
- Menjadikan halaman Goods Receipt berfokus pada proses penerimaan barang.
- Menjadi standar desain yang konsisten untuk seluruh Inventory & Pharmacy Service.

---

# 2. Business Principle

Goods Receipt merupakan proses pencatatan barang yang diterima dari supplier.

Pada tahap ini sistem bertanggung jawab untuk mencatat:

- Barang yang diterima
- Batch Number
- Expired Date
- Quantity
- Purchase Cost
- Discount
- Tax
- Nilai inventory yang masuk

Sedangkan informasi harga jual hanya bersifat referensi karena akan digunakan pada proses Inventory Batch dan Penjualan.

---

# 3. Design Principle

Halaman Goods Receipt memiliki dua jenis informasi:

## A. Primary Information

Informasi yang wajib menjadi fokus pengguna.

- Item
- Qty
- Batch
- Expired
- Harga Beli
- Total Pembelian

## B. Secondary Information

Informasi pendukung.

- Margin
- Harga Jual
- Estimasi Nilai Jual

Secondary Information tidak boleh lebih dominan dibandingkan informasi pembelian.

---

# 4. Form Input Goods Receipt

## Layout

```
+-------------------------------------------------------------------------------------------+
| ← Kembali                                                         Terima Barang          |
+-------------------------------------------------------------------------------------------+

PO-20260805-0001
Supplier : Bio Farma

------------------------------------------------------------

Mode Diskon        PPN (%)

[Dropdown]         [Input]

------------------------------------------------------------

ITEM DITERIMA

------------------------------------------------------------------------------------------------------------
Item             Qty PO    Qty Diterima   Batch     Expired     Harga Beli       Total Pembelian
------------------------------------------------------------------------------------------------------------
Paracetamol
500mg Tablet        15          15        BAT001    31/12/2027   Rp50.000         Rp750.000

                               ▼ Pricing Information

                               Margin
                               20% (Default)

                               Harga Jual / Item
                               Rp60.000

------------------------------------------------------------------------------------------------------------

Ringkasan Pembelian

Subtotal Pembelian          Rp750.000
Diskon                      Rp0
PPN                         Rp82.500
-------------------------------------------------
Grand Total                 Rp832.500

------------------------------------------------------------

Catatan

[................................................]

[Batal]                                   [Simpan Draft]

```

---

# 5. Item Table

Kolom yang direkomendasikan

|Kolom|Keterangan|
|------|----------|
|Item|Nama Item|
|Qty PO|Jumlah yang dipesan|
|Qty Diterima|Jumlah aktual diterima|
|Batch|Nomor Batch|
|Expired|Tanggal Kadaluarsa|
|Harga Beli|Harga beli per satuan|
|Total Pembelian|Qty × Harga Beli|

Tidak disarankan menampilkan:

- Harga Jual
- Subtotal Penjualan

di dalam tabel utama.

---

# 6. Pricing Information

Pricing ditempatkan sebagai informasi tambahan.

Bentuk:

Accordion

atau

Expandable Panel

```
▼ Pricing Information

Margin

20%

Harga Jual

Rp60.000

Estimasi Nilai Penjualan

Rp900.000
```

Panel ini dapat ditutup agar user gudang hanya fokus pada penerimaan barang.

---

# 7. Purchase Summary

Gunakan istilah yang eksplisit.

## Direkomendasikan

```
Ringkasan Pembelian

Subtotal Pembelian

Diskon

PPN

Grand Total
```

## Tidak Direkomendasikan

```
Subtotal

Grand Total
```

karena dapat menimbulkan ambiguitas.

---

# 8. Detail Goods Receipt

Setelah transaksi selesai, halaman detail memiliki struktur berbeda dengan form input.

---

## Header

```
GR-20260805-0001

Status
VERIFIED

Supplier
Bio Farma

Tanggal Diterima

Tanggal Verifikasi

Purchase Order
```

---

## Item

```
--------------------------------------------------------------------------------------------------------
Item            Qty     Batch      Expired      Harga Beli      Total Pembelian
--------------------------------------------------------------------------------------------------------
Paracetamol      15     BAT001     31/12/27     Rp50.000        Rp750.000
```

---

## Pricing Information

Dipisahkan menjadi card tersendiri.

```
Pricing Information

Margin

20%

Harga Jual / Item

Rp60.000

Estimasi Nilai Penjualan

Rp900.000
```

Card ini hanya bersifat informatif.

---

## Purchase Summary

```
Ringkasan Pembelian

Subtotal Pembelian

Rp750.000

Diskon

Rp0

PPN

Rp82.500

--------------------------------

Grand Total

Rp832.500
```

---

# 9. Information Hierarchy

Prioritas informasi pada halaman.

Level 1

- Item
- Qty
- Batch
- Expired

Level 2

- Harga Beli
- Total Pembelian

Level 3

- Margin
- Harga Jual

Level 4

- Estimasi Nilai Penjualan

Semakin rendah level informasi, semakin kecil visual emphasis yang diberikan.

---

# 10. UX Guidelines

## Jangan tampilkan dua "Subtotal"

Contoh yang harus dihindari

```
Subtotal

Rp750.000

...

Subtotal

Rp900.000
```

User tidak dapat membedakan konteks kedua nilai tersebut.

---

## Gunakan label yang spesifik

Gunakan:

- Total Pembelian
- Subtotal Pembelian
- Estimasi Nilai Penjualan

Hindari penggunaan label generik seperti:

- Total
- Subtotal

---

## Fokus Halaman

Goods Receipt adalah modul Purchasing.

Karena itu visual hierarchy harus selalu mengikuti urutan:

1. Barang diterima
2. Nilai pembelian
3. Ringkasan transaksi
4. Informasi pricing

bukan sebaliknya.

---

# 11. Business Benefits

Redesign ini memberikan beberapa keuntungan:

- Mengurangi kebingungan pengguna terhadap dua nilai subtotal.
- Memisahkan konteks Purchasing dan Pricing.
- Mempermudah proses training pengguna gudang.
- Konsisten dengan alur bisnis Inventory Batch.
- Siap dikembangkan untuk modul Stock Movement dan Dispensing.

---

# 12. Conclusion

Goods Receipt harus diposisikan sebagai modul yang berfokus pada pencatatan nilai pembelian dan stok yang masuk ke inventory.

Informasi harga jual tetap penting, namun hanya sebagai informasi referensi. Oleh karena itu informasi pricing sebaiknya dipisahkan secara visual melalui panel atau kartu tersendiri sehingga tidak mengganggu fokus utama pengguna.

Dengan pendekatan ini, tampilan menjadi lebih sederhana, lebih mudah dipahami, serta konsisten dengan proses bisnis Inventory & Pharmacy yang telah dirancang.
# 🧪 Quick Test Guide - Real Drug Recognition

## 🎯 How to Test Your Webcam Scanner

### Option 1: Print a Test Label (Best Results!)

Print this sample drug label on paper:

```
═══════════════════════════════════════
         PROPOFOL
    Injectable Emulsion
    200 mg/20 mL (10 mg/mL)
    
    NDC 00409-4676-01
    
    LOT: 2024A001
    EXP: 02/28/2026
    
    Rx Only
    Hospira, Inc.
═══════════════════════════════════════
```

### Option 2: Display on Another Device

Open this on your phone/tablet and scan it with your computer:

```
FENTANYL CITRATE
Injection, USP
100 mcg/2 mL (50 mcg/mL)

NDC 00074-3799-05

LOT: 2023B458
EXP: 12/31/2025

Fresenius Kabi USA, LLC
```

### Option 3: Test with Random Text

The OCR will try to extract information from any text!
Try scanning:
- Any printed text
- Medicine bottles
- Product labels
- Book pages

---

## 📸 Scanning Steps

1. **Open the app**: http://localhost:5173/
2. **Navigate**: Click "Scan Drug Label"
3. **Start Camera**: Click "Start Camera" button
4. **Allow Permissions**: Grant camera access
5. **Position Label**: Hold label in scanning frame
6. **Scan**: Click "Capture & Scan"
7. **Wait**: 3-8 seconds for processing
8. **Review**: Check detected information

---

## ✅ What to Expect

### During Scanning:
```
Status: Processing...
├─> Analyzing image...
├─> Extracting text with OCR...
└─> Validating with FDA database...
```

### Success Result:
```
✓ Drug label detected!
Found: Propofol 200mg/20mL (92% confidence)

Drug Information:
├─ Drug Name: Propofol
├─ NDC Code: 00409-4676-01
├─ Lot Number: 2024A001
├─ Expiry Date: 02/28/2026
├─ Manufacturer: Hospira, Inc.
├─ Dosage: 200mg/20mL
└─ Confidence: 92%
```

---

## 🎯 Tips for Best Results

### ✅ DO:
- Use good lighting (bright, even)
- Hold label steady
- Fill the frame with the label
- Keep camera focused
- Wait for autofocus
- Try multiple angles

### ❌ DON'T:
- Scan in low light
- Move while scanning
- Use blurry images
- Cover parts of the label
- Rush the process

---

## 🔍 What the Scanner Looks For

1. **NDC Code** (most important!)
   - Format: XXXXX-XXXX-XX
   - Example: 00409-4676-01

2. **Drug Name**
   - Usually at the top
   - Can be brand or generic

3. **Lot Number**
   - Starts with "LOT:" or "BATCH:"
   - Alphanumeric code

4. **Expiration Date**
   - Starts with "EXP:" or "EXPIRES:"
   - Format: MM/DD/YYYY

5. **Dosage**
   - Examples: 200mg/20mL, 100mcg, 2%

---

## 🚨 Troubleshooting

### "Could not read drug label"
**Fixes:**
- Improve lighting
- Move closer to label
- Clean camera lens
- Try different angle
- Ensure label is flat

### "FDA database unavailable"
**Fixes:**
- Check internet connection
- OCR still works offline
- FDA data won't be validated
- Lower confidence scores

### "Failed to access camera"
**Fixes:**
- Check browser permissions
- Close other apps using camera
- Try different browser
- Restart browser

---

## 📊 Understanding Results

### Confidence Scores:
- **90-100%**: Excellent! Full data + FDA validation
- **80-89%**: Good! Most data extracted
- **70-79%**: Fair! OCR only, no FDA match
- **50-69%**: Poor! Missing key information
- **<50%**: Bad! Try scanning again

### What Gets Added to Inventory:
```typescript
{
  ndcCode: "00409-4676-01",
  drugName: "Propofol 200mg/20mL",
  formType: "200mg/20mL",
  totalQuantity: 1,
  parLevel: 10,
  avgDailyUsage: 1,
  lots: [{
    lotNumber: "2024A001",
    quantity: 1,
    expDate: "02/28/2026",
    unitCost: 0
  }]
}
```

---

## 🎮 Try These Test Cases

### Test 1: Perfect Label (High Confidence)
```
MORPHINE SULFATE
10 mg/mL Injection
NDC 00143-9283-01
LOT: 2024E456
EXP: 05/15/2026
```
**Expected:** 95% confidence, full data

### Test 2: Partial Label (Medium Confidence)
```
ATROPINE 0.4mg/mL
Lot#2024K112
Expires 08/30/2026
```
**Expected:** 75% confidence, missing NDC

### Test 3: Just NDC (Low-Medium Confidence)
```
NDC 00409-1782-01
LOT: 2024H556
```
**Expected:** 70% confidence, FDA will fill drug name

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ OCR progress messages appear
- ✅ "Validating with FDA database..." shows
- ✅ Detection card displays with data
- ✅ Confidence score is shown
- ✅ Toast notification appears
- ✅ New item added to inventory
- ✅ Go to Inventory page and see it!

---

## 📱 Mobile Testing

**Works on mobile too!**
1. Access from phone browser
2. Grant camera permissions
3. Use rear camera for better quality
4. Hold phone steady
5. Better lighting = better results

---

## 🔄 Real-World Use Case

```
Hospital Pharmacy Workflow:
1. New shipment arrives
2. Open MedShare on tablet
3. Click "Scan Drug Label"
4. Scan each vial/box
5. Data auto-added to inventory
6. Instant alerts if expiring soon
7. No manual data entry!
```

---

## 📞 Need Help?

**Check these files:**
- `REAL_DRUG_RECOGNITION.md` - Full technical docs
- `IMPLEMENTATION_COMPLETE.md` - System overview
- `LIVEKIT_INTEGRATION.md` - LiveKit details

**Common Issues:**
- Camera not working? Check browser permissions
- Low accuracy? Improve lighting and focus
- FDA API down? OCR still works offline
- Slow processing? Normal for first scan (loading models)

---

## 🚀 You're Ready!

Your webcam scanner uses:
- ✅ Real OCR (Tesseract.js)
- ✅ Official FDA database
- ✅ Smart text parsing
- ✅ Confidence scoring
- ✅ Auto-inventory integration

**GO TEST IT NOW!** 🎯

Open http://localhost:5173/ and start scanning! 📸

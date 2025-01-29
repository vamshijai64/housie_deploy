const moment = require('moment');
const puppeteer = require('puppeteer');

function getDeliveryHTML(options) {
    return `
    <html>
    <style>
        body {
            background-color: #f0f0f0;
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
    
        header {
            background-color: #fff;
            width: 100%;
            padding: 20px;
            text-align: center;
        }
    
        h1 {
            color: #333;
            font-size: 2em;
        }
    
        h2 {
            color: #666;
            font-size: 1.5em;
        }
    
        p {
            color: #000;
            font-size: 1em;
        }
    
        .content {
            width: 100%;
            /* margin: 20px auto; */
            /* padding: 20px; */
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
    
        .logo {
            width: 100px;
            height: 100px;
            background-color: #003;
            margin: 20px auto;
        }
    
        .price {
            color: #666;
            font-size: 1.2em;
        }
    </style>
    
    <body>
        <!-- <header>
        </header> -->
        <div class="content">
            <div style="padding: 30px;">
                <div style="display: flex;flex-direction: column; justify-content: center; align-items: center;"><img
                        style="height: 200px; width: 250px;" src="https://dreamhousie.com/logo.png" alt="🌠 DREAMHOUSE 🌠">
                    <h1 style="padding-top: 20px;">Tax Invoice</h1>
                </div>
                <div style="display: flex; justify-content: center; padding-bottom: 15px; padding-top: 15px;">
                    <div style="background-color:#D3D3D3; width: 100%; height: 7px;"></div>
                </div>
                <h4 style="position: absolute; top: 0; right: 2px;">Date: ${moment().format('MMMM Do YYYY')}</h4>
                <h3>AK Imaginary Illusions Private Limited</h3>
                <h3>6-4-13/2, Pathuru, Tadepalligudem, West Godavari,</h3>
                <h3>Andhra Pradesh - 534101</h3>
                <h3>GST No: 37AAQCA6869E2Z3</h3>
                <h3>Invoice No: ${options.orderId}</h3>
                <h3>Recipient Full Name: ${options.customerName}</h3>
                <h3>Recipient Address/City: ${options.user_address}</h3>
                <h3>Place of Supply: ${options.state}</h3>
                <h3>Pin Code: ${options.pincode}</h3>
                <h3>Phone No: +91${options.phoneNumber}</h3>
                <h3>SAC Code : 998439</h3>
                <div style="display: flex;flex-direction: row; align-items: center;">
                    <p>Description of service - </p>
                    <h3 style="padding-left: 5px;">other online contents.</h3>
                </div>
                <div style="display: flex; justify-content: center; padding-bottom: 15px; padding-top: 15px;">
                    <div style="background-color:#D3D3D3; width: 100%; height: 7px; ;"></div>
                </div>
                <div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h2 style="color: #0000FF;">Description</h2>
                        <h2>Amount</h2>
    
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h3>Online Money Gaming Service <br />(Amount Deposited Incl. GST)</h3>
                        <h3>&#x20B9 ${options.total}</h3>
    
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h3 style="color: gray;">CGST @0%</h3>
                        <h3>&#x20B9 0</h3>
    
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h3 style="color: gray;">SGST @0%</h3>
                        <h3>&#x20B9 0</h3>
    
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h3 style="color: gray;">IGST @28%</h3>
                        <h3>&#x20B9 ${options.gst}</h3>
    
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                        <h3 style="color: gray;">Taxable Value</h3>
                        <h3>&#x20B9 ${options.taxable_amount}</h3>
    
                    </div>
                    <h3>Tax Value in Words : ${options.gstInWords}</h3>
                    <h3>Total Value in Words : ${options.totalInWords}</h3>
                </div>
                <div style="display: flex; justify-content: center; padding-bottom: 15px; padding-top: 15px;">
                    <div style="background-color:#D3D3D3; width: 100%; height: 7px; ;"></div>
                </div>
                <div style="display: flex; justify-content: center;">
                    <h4>This is a Computer Generated Invoice, hence Signature is not Required</h4>
                </div>
            </div>
        </div>
    </body>
    
    </html>
    `
}

async function getInvoice(options) {
    return new Promise(async (resolve, reject) => {
        try {
            const html = getDeliveryHTML(options);
            let pdf = "";
            await htmlToPdf(html)
                .then(pdfBuffer => {
                    // Do something with the PDF buffer (e.g., save to file, send as response, etc.)
                    console.log('PDF buffer created successfully:', pdfBuffer);
                    pdf = pdfBuffer;
                })
                .catch(error => {
                    console.error('Error creating PDF:', error);
                });

            resolve(pdf)
        } catch (err) {
            reject(err)
        }
    })
}

async function htmlToPdf(htmlContent) {
    // Launch headless Chrome
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create a new page
    const page = await browser.newPage();

    // Set the page content
    await page.setContent(htmlContent);

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({ format: 'A3', printBackground: true });

    // Close the browser
    await browser.close();

    return pdfBuffer;
}

module.exports = {
    getInvoice
}
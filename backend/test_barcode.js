async function test() {
  const shopId = '65e9b89b89b89b89b89b89b8'; // fake shopId
  
  const payload1 = { name: 'Item 1', price: 10, stock: 5, barcode: '' };
  const payload2 = { name: 'Item 2', price: 20, stock: 5, barcode: '' };

  const res1 = await fetch(`http://localhost:5000/api/inventory/${shopId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1)
  });
  console.log('Res1:', res1.status, await res1.text());

  const res2 = await fetch(`http://localhost:5000/api/inventory/${shopId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2)
  });
  console.log('Res2:', res2.status, await res2.text());
}
test();

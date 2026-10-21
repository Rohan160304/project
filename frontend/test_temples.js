import axios from 'axios';
async function run() {
  try {
    const res = await axios.get('http://localhost:8000/api/v1/temples');
    const items = res.data?.data?.items || res.data?.data || res.data?.items || [];
    console.log(JSON.stringify(items.map(t => ({
      _id: t._id,
      id: t.id,
      name: t.name,
      hasBhojanshala: t.hasBhojanshala,
      bhojanshalaAvailability: t.bhojanshalaAvailability
    })), null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();

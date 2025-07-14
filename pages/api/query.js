export default async function handler(req, res) {
  const { query } = req.body;

  // Placeholder AI response logic
  if (query.toLowerCase().includes("us retailers")) {
    res.status(200).json({ result: "There are currently 42 live retailers in the US." });
  } else {
    res.status(200).json({ result: "I'll need to check that data – coming soon!" });
  }
}
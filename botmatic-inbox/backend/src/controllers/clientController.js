import { listClients } from "../services/clientService.js";

export function getClients(req, res) {
  const clients = listClients(req.auth.user.companyId);
  res.json({ clients });
}

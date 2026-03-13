import {
  getChat,
  listChats,
  releaseChat,
  resetUnread,
  takeoverChat,
} from "../services/chatService.js";
import { httpError } from "../utils/httpError.js";

export function getChats(req, res) {
  const filter = req.query.filter || "all";
  const chats = listChats(req.auth.user.companyId, filter);
  res.json({ chats });
}

export function getChatById(req, res, next) {
  try {
    const chat = getChat(req.auth.user.companyId, req.params.id);
    if (!chat) throw httpError(404, "Chat not found");
    resetUnread(req.auth.user.companyId, chat.id);
    res.json({ chat: getChat(req.auth.user.companyId, chat.id) });
  } catch (error) {
    next(error);
  }
}

export function takeOver(req, res, next) {
  try {
    const chat = takeoverChat(
      req.auth.user.companyId,
      req.params.id,
      req.auth.user.id
    );
    if (!chat) throw httpError(404, "Chat not found");
    res.json({ chat });
  } catch (error) {
    next(error);
  }
}

export function release(req, res, next) {
  try {
    const chat = releaseChat(req.auth.user.companyId, req.params.id);
    if (!chat) throw httpError(404, "Chat not found");
    res.json({ chat });
  } catch (error) {
    next(error);
  }
}

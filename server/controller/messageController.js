export const getRoomMessages = async (req, res) => {
  const messages = await Message.find({
    roomId: req.params.roomId,
  })
    .populate("sender", "name")
    .sort({ createdAt: 1 });

  res.json(messages);
};

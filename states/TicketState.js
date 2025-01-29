class TicketState {
  constructor() {
    if (!TicketState.instance) {
      this.channelIds = [];
      TicketState.instance = this;
    }
    return TicketState.instance;
  }

  getChannelIds() {
    return this.channelIds;
  }

  addChannelId(ticketId, channelId) {
    this.channelIds[channelId] = ticketId;
  }

  setChannelIds(channelIds) {
    this.channelIds = channelIds;
  }

  removeChannelId(channelId) {
    delete this.channelIds[channelId];
  }
}

export default new TicketState();

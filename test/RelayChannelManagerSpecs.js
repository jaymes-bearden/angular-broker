describe('Relay Channel Manager', function () {

    beforeEach(function () {
        module("angular-broker");
    });

    beforeEach(inject(function (_RelayChannelManager_) {
        this.RelayChannelManager = _RelayChannelManager_;
    }));

    it('should not allow null, blank and empty channel names', function () {
        var manager = this.RelayChannelManager;

        expect(manager.getChannel).toThrow();
        expect(function() {manager.getChannel(null)}).toThrow();
        expect(function() {manager.getChannel("")}).toThrow();
    });

    it('should return a channel with a given channel name', function () {
        var channel = this.RelayChannelManager.getChannel("testChannel");

        expect(channel).toBeDefined();
        expect(channel.channel).toEqual("testChannel");
    });

    it('should return the same channel when requested multiple times', function () {
        var channel = this.RelayChannelManager.getChannel("channel1");
        var handler = {
            handler1: function() {
            }
        };
        spyOn(handler, "handler1");

        channel.subscribe(handler.handler1);
        channel.dispatch({});

        var sameChannel = this.RelayChannelManager.getChannel("channel1");
        sameChannel.dispatch({});

        expect(channel.channel).toEqual(sameChannel.channel);
        expect(handler.handler1.calls.length).toEqual(2);
    });
});
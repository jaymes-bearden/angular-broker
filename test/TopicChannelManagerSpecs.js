describe('Topic Channel Manager', function () {

    var topicExtractor = function(msg) {
        return msg.topic;
    };

    beforeEach(function () {
        module("angular-broker");
    });

    beforeEach(inject(function (_TopicChannelManager_) {
        this.TopicChannelManager = _TopicChannelManager_;
    }));

    it('should not allow null, blank and empty channel names', function () {
        var manager = this.TopicChannelManager;

        expect(manager.getChannel).toThrow();
        expect(function() {manager.getChannel(null)}).toThrow();
        expect(function() {manager.getChannel("")}).toThrow();
    });

    it('should not allow null or non-function topic extractors', function () {
        var manager = this.TopicChannelManager;

        expect(function() {manager.getChannel("testChannel", null)}).toThrow();
        expect(function() {manager.getChannel("testChannel", "")}).toThrow();
        expect(function() {manager.getChannel("testChannel", 1)}).toThrow();
    });

    it('should return a channel with a given channel name', function () {
        var channel = this.TopicChannelManager.getChannel("testChannel", topicExtractor);

        expect(channel).toBeDefined();
        expect(channel.channel).toEqual("testChannel");
    });

    it('should return the same channel when requested multiple times', function () {
        var channel = this.TopicChannelManager.getChannel("channel1", topicExtractor);
        var handler = {
            handler1: function() {
            }
        };
        spyOn(handler, "handler1");

        channel.subscribe("topic1", handler.handler1);
        channel.dispatch({topic: "topic1"});

        var sameChannel = this.TopicChannelManager.getChannel("channel1", topicExtractor);
        sameChannel.dispatch({topic: "topic1"});

        expect(channel.channel).toEqual(sameChannel.channel);
        expect(handler.handler1.calls.length).toEqual(2);
    });
});
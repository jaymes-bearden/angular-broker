(function (angular) {
    function Subscription(id, handler, dispatcher) {
        return {
            id: id,
            handler: handler,
            unsubscribe: function () {
                dispatcher.unsubscribe(this);
            }
        }
    }

    angular.module("angular-broker", [])

    /**
     * Relay Dispatcher
     *
     * A Relay Dispatcher provides for subscription of a list of handlers. During dispatch, each subscription is
     * called in order of registration.
     *
     * Registration of a handler returns a Subscription object with an unsubscribe function. This can be used to remove
     * the subscription directly, or, the Subscription can be send to the dispatcher's unsubscribe function.
     *
     * The Relay Dispatcher is a specialization of a Recipient List router
     */
        .factory("RelayDispatcher", function () {
            var tracker = 0;

            function RelayDispatcher() {
                var subscriptions = [];

                return {
                    /**
                     * Register a handler with this dispatcher
                     * @param {Function} handler function
                     * @returns {Subscription} object containing an unsubscribe function
                     */
                    subscribe: function (handler) {
                        if (!angular.isFunction(handler)) {
                            throw "Supplied handler must be a function";
                        }

                        var subscription = Subscription("sub-" + tracker++, handler, this);
                        subscriptions.push(subscription);

                        return subscription;
                    },

                    /**
                     * Unregister the supplied Subscription from this dispatcher
                     * @param {Subscription} subscription
                     */
                    unsubscribe: function (subscription) {
                        if (!subscription || !subscription.id) {
                            return;
                        }

                        subscriptions = _.reject(subscriptions, function (sub) {
                            return sub.id == subscription.id;
                        });

                        subscription.id = "";
                        subscription.unsubscribe = angular.noop;
                    },

                    /**
                     * Dispatch the message to subscribed handlers
                     * @param {Object|String} message to dispatch to all of the subscribed handlers
                     */
                    dispatch: function (message) {
                        if (!message) {
                            return;
                        }

                        _.each(subscriptions, function (sub) {
                            // Ensure no modification occur during dispatch
                            sub.handler(angular.copy(message));
                        })
                    }
                }
            }

            return {
                getDispatcher: function () {
                    var dispatcher = RelayDispatcher();

                    return {
                        subscribe: dispatcher.subscribe,
                        unsubscribe: dispatcher.unsubscribe,
                        dispatch: dispatcher.dispatch
                    }
                }
            };
        })
    /**
     * Topic Dispatcher
     *
     * This dispatcher allows for registration of handler methods against a particular message topic. Creation of the dispatcher
     * depends on a topic extractor function. This function creates a topic key from a supplied message during dispatch which matches
     * a topic key during the initial handler registration.
     *
     * Multiple handler methods can be registered with a particular topic. During dispatch, each handler will be called in order
     * of registration for a given message topic.
     *
     * Registration of a handler returns a Subscription object with an unsubscribe function. This can be used to remove
     * the subscription directly, or, the Subscription can be send to the dispatcher's unsubscribe function.
     *
     * The Topic Dispatcher is a specialization of a Content-Based router.
     */
        .factory("TopicDispatcher", function () {
            var tracker = 0;

            function TopicDispatcher(topicExtractor) {
                var subscriptions = {};

                return {
                    /**
                     * Register a topic with the handler
                     * @param {String} topic identifying the message topic sent to the handler
                     * @param {Function} handler function
                     * @returns {Subscription} object containing an unsubscribe function
                     */
                    subscribe: function (topic, handler) {
                        if (!angular.isString(topic) || topic.length == 0) {
                            throw "Supplied topic must be a non-empty string";
                        }

                        if (!angular.isFunction(handler)) {
                            throw "Supplied handler must be a function";
                        }

                        if (!angular.isArray(subscriptions[topic])) {
                            subscriptions[topic] = [];
                        }

                        var subscription = Subscription(topic + "-" + tracker++, handler, this);
                        subscription.topic = topic;
                        subscriptions[topic].push(subscription);

                        return subscription;
                    },

                    /**
                     * Unregister the supplied Subscription from this dispatcher
                     * @param {Subscription} subscription
                     */
                    unsubscribe: function (subscription) {
                        if (!subscription || !subscription.id || !subscription.topic) {
                            return;
                        }

                        if (subscriptions[subscription.topic]) {
                            subscriptions[subscription.topic] = _.reject(subscriptions[subscription.topic], function (sub) {
                                return sub.id == subscription.id;
                            });
                        }

                        subscription.id = "";
                        subscription.topic = "";
                        subscription.unsubscribe = angular.noop;
                    },

                    /**
                     * Dispatch the message to subscribed handlers
                     * @param {Object|String} message to dispatch to all of the subscribed handlers
                     */
                    dispatch: function (message) {
                        if (!message) {
                            return;
                        }

                        var topic = topicExtractor(angular.copy(message));

                        _.each(subscriptions[topic], function (sub) {
                            // Ensure no modification from dispatch
                            sub.handler(angular.copy(message));
                        })
                    }
                }
            }

            return {
                /**
                 * Return a topic dispatcher for the given topic extractor
                 * @param {Function} topicExtractor used to identify a message topic to dispatch the message to handlers
                 * @returns dispatcher with subscribe, unsubscribe and dispatch functions
                 */
                getDispatcher: function (topicExtractor) {
                    if (!angular.isFunction(topicExtractor)) {
                        throw "TopicDispatcher requires a defined topic extractor function";
                    }

                    var dispatcher = TopicDispatcher(topicExtractor);

                    return {
                        subscribe: dispatcher.subscribe,
                        unsubscribe: dispatcher.unsubscribe,
                        dispatch: dispatcher.dispatch
                    }
                }
            };
        })
        .factory("RelayChannelManager", function (RelayDispatcher) {
            var channels = {};

            function RelayChannel(channelName) {
                var dispatcher = RelayDispatcher.getDispatcher();
                dispatcher.channel = channelName;

                return dispatcher;
            }

            return {
                /**
                 * Return a relay dispatcher channel. Multiple calls with the same channel name will
                 * always return the same channel.
                 * @param {String} channelName
                 * @returns {RelayDispatcher}
                 */
                getChannel: function (channelName) {
                    if (!angular.isString(channelName) || channelName.length == 0) {
                        throw "Supplied channel name must be a string of non-zero length";
                    }

                    var channel = channelName && channels[channelName];

                    if (!channel) {
                        channel = RelayChannel(channelName);
                        channels[channelName] = channel;
                    }

                    return channel;
                }
            };
        })
        .factory("TopicChannelManager", function (TopicDispatcher) {
            var channels = {};

            function TopicChannel(channelName, topicExtractor) {
                var dispatcher = TopicDispatcher.getDispatcher(topicExtractor);
                dispatcher.channel = channelName;

                return dispatcher;
            }

            return {
                /**
                 * Return a topic dispatcher channel configured with the supplied topic extractor. Multiple
                 * calls with the same channel name will always return the same channel.
                 * @param {String} channelName
                 * @param {function} topicExtractor
                 * @returns {RelayDispatcher}
                 */
                getChannel: function (channelName, topicExtractor) {
                    if (!angular.isString(channelName) || channelName.length == 0) {
                        throw "Supplied channel name must be a string of non-zero length";
                    }

                    if (!angular.isFunction(topicExtractor)) {
                        throw "Supplied topic extractor must be a defined function";
                    }

                    var channel = channelName && channels[channelName];

                    if (!channel) {
                        channel = TopicChannel(channelName, topicExtractor);
                        channels[channelName] = channel;
                    }

                    return channel;
                }
            };
        })
    ;
})(angular);
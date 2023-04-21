package base.profile.service;

import java.io.InputStream;

public interface EventSubscriberClient {
    void subscribe(EventHandler eventHandler);

    interface EventHandler {
        void handle(Event event);

        class Event {
            private InputStream content;

            public Event() { }

            public Event(InputStream content) {
                this.content = content;
            }

            public InputStream getContent() {
                return content;
            }

            public void setContent(InputStream content) {
                this.content = content;
            }
        }
    }
}

package base.profile.controller;

import base.profile.service.ProfileService;
import base.profile.service.model.Authority;
import base.profile.service.model.Role;

import java.io.InputStream;

public class ProfileAmqpController {
    private final ProfileService profileService;

    public ProfileAmqpController(ProfileService profileService) {
        if (profileService == null) {
            throw new RuntimeException("Invalid profileService provided to ProfileAmqpController constructor");
        }
        this.profileService = profileService;
    }

    public void deleteProfile(Message message) {
        Authority authority = new Authority(null, Role.SYSTEM, 0);
        String id;
        try {
            id = new String(message.getContent().readAllBytes());
        }
        catch (Exception e) {
            return;
        }
        try {
            profileService.deleteProfile(authority, id);
        }
        catch (Exception ignored) { }
    }

    public static class Message {
        private InputStream content;

        public Message() { }

        public Message(InputStream content) {
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

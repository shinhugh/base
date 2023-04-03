package base.useraccount.client.model;

public enum Role {
    SYSTEM ((short) Math.pow(2, 0)),
    USER ((short) Math.pow(2, 1)),
    ADMIN ((short) Math.pow(2, 2));

    private short bitFlag;

    Role(short bitFlag) {
        this.bitFlag = bitFlag;
    }

    public short getBitFlag() {
        return this.bitFlag;
    }
}

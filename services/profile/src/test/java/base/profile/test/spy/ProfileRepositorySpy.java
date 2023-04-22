package base.profile.test.spy;

import base.profile.repository.ProfileRepository;
import base.profile.repository.model.Profile;

public class ProfileRepositorySpy implements ProfileRepository {
    private Profile[] readByAccountIdReturnValue;
    private int readByAccountIdInvokeCount;
    private String readByAccountIdAccountIdArgument;
    private Profile[] readByAccountIdAndNameReturnValue;
    private int readByAccountIdAndNameInvokeCount;
    private String readByAccountIdAndNameAccountIdArgument;
    private String readByAccountIdAndNameNameArgument;
    private Profile createReturnValue;
    private int createInvokeCount;
    private Profile createProfileArgument;
    private Profile updateByAccountIdReturnValue;
    private int updateByAccountIdInvokeCount;
    private String updateByAccountIdAccountIdArgument;
    private Profile updateByAccountIdProfileArgument;
    private int deleteByAccountIdReturnValue;
    private int deleteByAccountIdInvokeCount;
    private String deleteByAccountIdAccountIdArgument;

    @Override
    public Profile[] readByAccountId(String accountId) {
        readByAccountIdInvokeCount++;
        readByAccountIdAccountIdArgument = accountId;
        return readByAccountIdReturnValue;
    }

    @Override
    public Profile[] readByAccountIdAndName(String accountId, String name) {
        readByAccountIdAndNameInvokeCount++;
        readByAccountIdAndNameAccountIdArgument = accountId;
        readByAccountIdAndNameNameArgument = name;
        return readByAccountIdAndNameReturnValue;
    }

    @Override
    public Profile create(Profile profile) {
        createInvokeCount++;
        createProfileArgument = profile;
        return createReturnValue;
    }

    @Override
    public Profile updateByAccountId(String accountId, Profile profile) {
        updateByAccountIdInvokeCount++;
        updateByAccountIdAccountIdArgument = accountId;
        updateByAccountIdProfileArgument = profile;
        return updateByAccountIdReturnValue;
    }

    @Override
    public int deleteByAccountId(String accountId) {
        deleteByAccountIdInvokeCount++;
        deleteByAccountIdAccountIdArgument = accountId;
        return deleteByAccountIdReturnValue;
    }

    public void resetSpy() {
        readByAccountIdInvokeCount = 0;
        readByAccountIdAccountIdArgument = null;
        readByAccountIdAndNameInvokeCount = 0;
        readByAccountIdAndNameAccountIdArgument = null;
        readByAccountIdAndNameNameArgument = null;
        createInvokeCount = 0;
        createProfileArgument = null;
        updateByAccountIdInvokeCount = 0;
        updateByAccountIdAccountIdArgument = null;
        updateByAccountIdProfileArgument = null;
        deleteByAccountIdInvokeCount = 0;
        deleteByAccountIdAccountIdArgument = null;
    }

    public void setReadByAccountIdReturnValue(Profile[] readByAccountIdReturnValue) {
        this.readByAccountIdReturnValue = readByAccountIdReturnValue;
    }

    public int getReadByAccountIdInvokeCount() {
        return readByAccountIdInvokeCount;
    }

    public String getReadByAccountIdAccountIdArgument() {
        return readByAccountIdAccountIdArgument;
    }

    public void setReadByAccountIdAndNameReturnValue(Profile[] readByAccountIdAndNameReturnValue) {
        this.readByAccountIdAndNameReturnValue = readByAccountIdAndNameReturnValue;
    }

    public int getReadByAccountIdAndNameInvokeCount() {
        return readByAccountIdAndNameInvokeCount;
    }

    public String getReadByAccountIdAndNameAccountIdArgument() {
        return readByAccountIdAndNameAccountIdArgument;
    }

    public String getReadByAccountIdAndNameNameArgument() {
        return readByAccountIdAndNameNameArgument;
    }

    public void setCreateReturnValue(Profile createReturnValue) {
        this.createReturnValue = createReturnValue;
    }

    public int getCreateInvokeCount() {
        return createInvokeCount;
    }

    public Profile getCreateProfileArgument() {
        return createProfileArgument;
    }

    public void setUpdateByAccountIdReturnValue(Profile updateByAccountIdReturnValue) {
        this.updateByAccountIdReturnValue = updateByAccountIdReturnValue;
    }

    public int getUpdateByAccountIdInvokeCount() {
        return updateByAccountIdInvokeCount;
    }

    public String getUpdateByAccountIdAccountIdArgument() {
        return updateByAccountIdAccountIdArgument;
    }

    public Profile getUpdateByAccountIdProfileArgument() {
        return updateByAccountIdProfileArgument;
    }

    public void setDeleteByAccountIdReturnValue(int deleteByAccountIdReturnValue) {
        this.deleteByAccountIdReturnValue = deleteByAccountIdReturnValue;
    }

    public int getDeleteByAccountIdInvokeCount() {
        return deleteByAccountIdInvokeCount;
    }

    public String getDeleteByAccountIdAccountIdArgument() {
        return deleteByAccountIdAccountIdArgument;
    }
}

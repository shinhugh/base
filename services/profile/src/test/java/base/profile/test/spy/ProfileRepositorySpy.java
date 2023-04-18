package base.profile.test.spy;

import base.profile.repository.ProfileRepository;
import base.profile.repository.model.Profile;

public class ProfileRepositorySpy implements ProfileRepository {
    private Profile[] readByIdAndNameReturnValue;
    private int readByIdAndNameInvokeCount;
    private String readByIdAndNameIdArgument;
    private String readByIdAndNameNameArgument;
    private Profile createReturnValue;
    private int createInvokeCount;
    private Profile createProfileArgument;
    private Profile updateByIdAndNameReturnValue;
    private int updateByIdAndNameInvokeCount;
    private String updateByIdAndNameIdArgument;
    private String updateByIdAndNameNameArgument;
    private Profile updateByIdAndNameProfileArgument;
    private int deleteByIdAndNameReturnValue;
    private int deleteByIdAndNameInvokeCount;
    private String deleteByIdAndNameIdArgument;
    private String deleteByIdAndNameNameArgument;

    @Override
    public Profile[] readByIdAndName(String id, String name) {
        readByIdAndNameInvokeCount++;
        readByIdAndNameIdArgument = id;
        readByIdAndNameNameArgument = name;
        return readByIdAndNameReturnValue;
    }

    @Override
    public Profile create(Profile profile) {
        createInvokeCount++;
        createProfileArgument = profile;
        return createReturnValue;
    }

    @Override
    public Profile updateByIdAndName(String id, String name, Profile profile) {
        updateByIdAndNameInvokeCount++;
        updateByIdAndNameIdArgument = id;
        updateByIdAndNameNameArgument = name;
        updateByIdAndNameProfileArgument = profile;
        return updateByIdAndNameReturnValue;
    }

    @Override
    public int deleteByIdAndName(String id, String name) {
        deleteByIdAndNameInvokeCount++;
        deleteByIdAndNameIdArgument = id;
        deleteByIdAndNameNameArgument = name;
        return deleteByIdAndNameReturnValue;
    }

    public void resetSpy() {
        readByIdAndNameInvokeCount = 0;
        readByIdAndNameIdArgument = null;
        readByIdAndNameNameArgument = null;
        createInvokeCount = 0;
        createProfileArgument = null;
        updateByIdAndNameInvokeCount = 0;
        updateByIdAndNameIdArgument = null;
        updateByIdAndNameNameArgument = null;
        updateByIdAndNameProfileArgument = null;
        deleteByIdAndNameInvokeCount = 0;
        deleteByIdAndNameIdArgument = null;
        deleteByIdAndNameNameArgument = null;
    }

    public void setReadByIdAndNameReturnValue(Profile[] readByIdAndNameReturnValue) {
        this.readByIdAndNameReturnValue = readByIdAndNameReturnValue;
    }

    public int getReadByIdAndNameInvokeCount() {
        return readByIdAndNameInvokeCount;
    }

    public String getReadByIdAndNameIdArgument() {
        return readByIdAndNameIdArgument;
    }

    public String getReadByIdAndNameNameArgument() {
        return readByIdAndNameNameArgument;
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

    public void setUpdateByIdAndNameReturnValue(Profile updateByIdAndNameReturnValue) {
        this.updateByIdAndNameReturnValue = updateByIdAndNameReturnValue;
    }

    public int getUpdateByIdAndNameInvokeCount() {
        return updateByIdAndNameInvokeCount;
    }

    public String getUpdateByIdAndNameIdArgument() {
        return updateByIdAndNameIdArgument;
    }

    public String getUpdateByIdAndNameNameArgument() {
        return updateByIdAndNameNameArgument;
    }

    public Profile getUpdateByIdAndNameProfileArgument() {
        return updateByIdAndNameProfileArgument;
    }

    public void setDeleteByIdAndNameReturnValue(int deleteByIdAndNameReturnValue) {
        this.deleteByIdAndNameReturnValue = deleteByIdAndNameReturnValue;
    }

    public int getDeleteByIdAndNameInvokeCount() {
        return deleteByIdAndNameInvokeCount;
    }

    public String getDeleteByIdAndNameIdArgument() {
        return deleteByIdAndNameIdArgument;
    }

    public String getDeleteByIdAndNameNameArgument() {
        return deleteByIdAndNameNameArgument;
    }
}

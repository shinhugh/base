package base.useraccount.test.spy;

import base.useraccount.model.UserAccount;
import base.useraccount.repository.UserAccountRepository;

public class UserAccountRepositorySpy implements UserAccountRepository {
    private UserAccount[] readByIdAndNameReturnValue;
    private int readByIdAndNameInvokeCount;
    private String readByIdAndNameIdArgument;
    private String readByIdAndNameNameArgument;
    private UserAccount createReturnValue;
    private int createInvokeCount;
    private UserAccount createUserAccountArgument;
    private UserAccount updateByIdAndNameReturnValue;
    private int updateByIdAndNameInvokeCount;
    private String updateByIdAndNameIdArgument;
    private String updateByIdAndNameNameArgument;
    private UserAccount updateByIdAndNameUserAccountArgument;
    private int deleteByIdAndNameReturnValue;
    private int deleteByIdAndNameInvokeCount;
    private String deleteByIdAndNameIdArgument;
    private String deleteByIdAndNameNameArgument;

    @Override
    public UserAccount[] readByIdAndName(String id, String name) {
        readByIdAndNameInvokeCount++;
        readByIdAndNameIdArgument = id;
        readByIdAndNameNameArgument = name;
        return readByIdAndNameReturnValue;
    }

    @Override
    public UserAccount create(UserAccount userAccount) {
        createInvokeCount++;
        createUserAccountArgument = userAccount;
        return createReturnValue;
    }

    @Override
    public UserAccount updateByIdAndName(String id, String name, UserAccount userAccount) {
        updateByIdAndNameInvokeCount++;
        updateByIdAndNameIdArgument = id;
        updateByIdAndNameNameArgument = name;
        updateByIdAndNameUserAccountArgument = userAccount;
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
        createUserAccountArgument = null;
        updateByIdAndNameInvokeCount = 0;
        updateByIdAndNameIdArgument = null;
        updateByIdAndNameNameArgument = null;
        updateByIdAndNameUserAccountArgument = null;
        deleteByIdAndNameInvokeCount = 0;
        deleteByIdAndNameIdArgument = null;
        deleteByIdAndNameNameArgument = null;
    }

    public void setReadByIdAndNameReturnValue(UserAccount[] readByIdAndNameReturnValue) {
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

    public void setCreateReturnValue(UserAccount createReturnValue) {
        this.createReturnValue = createReturnValue;
    }

    public int getCreateInvokeCount() {
        return createInvokeCount;
    }

    public UserAccount getCreateUserAccountArgument() {
        return createUserAccountArgument;
    }

    public void setUpdateByIdAndNameReturnValue(UserAccount updateByIdAndNameReturnValue) {
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

    public UserAccount getUpdateByIdAndNameUserAccountArgument() {
        return updateByIdAndNameUserAccountArgument;
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

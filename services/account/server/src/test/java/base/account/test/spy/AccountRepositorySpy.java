package base.account.test.spy;

import base.account.model.Account;
import base.account.repository.AccountRepository;

public class AccountRepositorySpy implements AccountRepository {
    private Account[] readByIdAndNameReturnValue;
    private int readByIdAndNameInvokeCount;
    private String readByIdAndNameIdArgument;
    private String readByIdAndNameNameArgument;
    private Account createReturnValue;
    private int createInvokeCount;
    private Account createAccountArgument;
    private Account updateByIdAndNameReturnValue;
    private int updateByIdAndNameInvokeCount;
    private String updateByIdAndNameIdArgument;
    private String updateByIdAndNameNameArgument;
    private Account updateByIdAndNameAccountArgument;
    private int deleteByIdAndNameReturnValue;
    private int deleteByIdAndNameInvokeCount;
    private String deleteByIdAndNameIdArgument;
    private String deleteByIdAndNameNameArgument;

    @Override
    public Account[] readByIdAndName(String id, String name) {
        readByIdAndNameInvokeCount++;
        readByIdAndNameIdArgument = id;
        readByIdAndNameNameArgument = name;
        return readByIdAndNameReturnValue;
    }

    @Override
    public Account create(Account account) {
        createInvokeCount++;
        createAccountArgument = account;
        return createReturnValue;
    }

    @Override
    public Account updateByIdAndName(String id, String name, Account account) {
        updateByIdAndNameInvokeCount++;
        updateByIdAndNameIdArgument = id;
        updateByIdAndNameNameArgument = name;
        updateByIdAndNameAccountArgument = account;
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
        createAccountArgument = null;
        updateByIdAndNameInvokeCount = 0;
        updateByIdAndNameIdArgument = null;
        updateByIdAndNameNameArgument = null;
        updateByIdAndNameAccountArgument = null;
        deleteByIdAndNameInvokeCount = 0;
        deleteByIdAndNameIdArgument = null;
        deleteByIdAndNameNameArgument = null;
    }

    public void setReadByIdAndNameReturnValue(Account[] readByIdAndNameReturnValue) {
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

    public void setCreateReturnValue(Account createReturnValue) {
        this.createReturnValue = createReturnValue;
    }

    public int getCreateInvokeCount() {
        return createInvokeCount;
    }

    public Account getCreateAccountArgument() {
        return createAccountArgument;
    }

    public void setUpdateByIdAndNameReturnValue(Account updateByIdAndNameReturnValue) {
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

    public Account getUpdateByIdAndNameAccountArgument() {
        return updateByIdAndNameAccountArgument;
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

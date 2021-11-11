const DbSession = require('../lib/database.js');
const Config = require('config');
const tools = require('../lib/tools');

/* Create Test data */
const testTeacher = {
  userId: 'testTeacher',
  token: 'testTokenTeacher',
};
const testStudent = {
  userId: 'testStudent',
  token: 'testTokenStudent',
};

const contextId = 'testContext';
const resourceLinkId = 'testResourceLinkId';
const filename = 'main.c';
const helloWorld = `
#include<stdio.h>

int main() {
     printf("Hallo 1235123");
     return 0;
}
`;
const helloWorldConverted = tools.convertCode(helloWorld);
const testError = 'Testerror';


/* Remove all test Documents from test database collections */
const MongoClient = require('mongodb').MongoClient;

test('remove test data from database for dbSession test', (done) => {
  MongoClient.connect(Config.database.url, (err, db) => {
    expect(err).toBeNull();
    db.collection('files').remove({ userId: { $in: [testTeacher.userId, testStudent.userId] } }, (err2) => {
      expect(err2).toBeNull();
      db.close();
      done();
    });
    db.collection('errors').remove({ contextId }, (err2) => {
      expect(err2).toBeNull();
      db.close();
      done();
    });
  });
});


/* tests */

test('DbSession constructor test', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(dbSession).toBeDefined();
  expect(dbSession.userId).toBe(testTeacher.userId);
  expect(dbSession.contextId).toBe(contextId);
  expect(dbSession.resourceLinkId).toBe(resourceLinkId);
  expect(dbSession.token).toBe(testTeacher.token);
});

test('DbSession constructor undefined parameters execption', () => {
  expect(() => {
    new DbSession(undefined, contextId, resourceLinkId, testTeacher.token);
  }).toThrow();
  expect(() => {
    new DbSession(testTeacher.userId, undefined, resourceLinkId, testTeacher.token);
  }).toThrow();
  expect(() => {
    new DbSession(testTeacher.userId, contextId, undefined, testTeacher.token);
  }).toThrow();
  expect(() => {
    new DbSession(testTeacher.userId, contextId, resourceLinkId, undefined);
  }).toThrow();
});

test('DbSession createSession undefined parameters execption', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(() => {
    dbSession.createSession(undefined);
  }).toThrow();
});

test('DbSession saveFile undefined parameters execption', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(() => {
    const buffer = Buffer.from(helloWorld, 'utf-8');
    dbSession.saveFile(undefined, buffer);
  }).toThrow();
  expect(() => {
    dbSession.saveFile(filename, undefined);
  }).toThrow();
  expect(() => {
    const buffer = Buffer.from(helloWorld, 'utf-8');
    dbSession.saveFile(filename, buffer, null);
  }).toThrow();
});

test('DbSession saveError undefined parameters execption', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(() => {
    dbSession.saveError(undefined);
  }).toThrow();
  expect(() => {
    dbSession.saveError(testError, null);
  }).toThrow();
});

test('DbSession removeFiles undefined parameters execption', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(() => {
    dbSession.removeFiles(undefined);
  }).toThrow();
  expect(() => {
    dbSession.removeFiles(filename, null);
  }).toThrow();
});

test('DbSession endCourse undefined parameters execption', () => {
  const dbSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
  expect(() => {
    dbSession.endCourse(null);
  }).toThrow();
});

// Test a user story 
// Teacher Session
// Teacher creates draft
// Students Session
// students gets draft
// Student saves error
// Teacher get correct statistic
// Teacher removeFile
// Teacher endCourse

const teacherSession = new DbSession(testTeacher.userId, contextId, resourceLinkId, testTeacher.token);
test('DbSession createSession teacher', (done) => {
  teacherSession.createSession(true, (error, files, statistic) => {
    expect(error).toBeNull();
    expect(files).toBeDefined();
    expect(statistic).toBeDefined();
    done();
  });
});


test('DbSession save file from teacher', (done) => {
  const buffer = Buffer.from(helloWorld, 'utf-8');
  teacherSession.saveFile(filename, buffer, (error) => {
    expect(error).toBeNull();
    done();
  });
});

const studentSession = new DbSession(testStudent.userId, contextId, resourceLinkId, testStudent.token);
test('DbSession createSession student', (done) => {
  studentSession.createSession(false, (error, files, statistic) => {
    expect(error).toBeNull();
    expect(files).toBeDefined();
    expect(files).toHaveLength(1);
    expect(files[0].content).toBe(helloWorldConverted);
    expect(statistic).toBeUndefined();
    done();
  });
});

test('DbSession save file from student', (done) => {
  const buffer = Buffer.from(helloWorld, 'utf-8');
  studentSession.saveFile(filename, buffer, (error) => {
    expect(error).toBeNull();
    done();
  });
});

test('DbSession save error from student', (done) => {
  studentSession.saveError(testError, (error) => {
    expect(error).toBeNull();
    done();
  });
});

test('DbSession test statistic', (done) => {
  teacherSession.createSession(true, (error, files, statistic) => {
    expect(error).toBeNull();
    expect(statistic).toBeDefined();
    expect(statistic.usersCount).toBe(2);
    expect(statistic.errors).toHaveLength(1);
    expect(statistic.errors[0].count).toBe(1);
    expect(statistic.errors[0].errorMessage).toBe(testError);
    done();
  });
});

test('DbSession removeFile as teacher', (done) => {
  teacherSession.removeFiles(filename, (error) => {
    expect(error).toBeNull();
    teacherSession.createSession(true, (error2, files) => {
      expect(error).toBeNull();
      expect(files).toHaveLength(0);
      done();
    });
  });
});

test('DbSession endCourse as student', () => {
  expect(() => {
    studentSession.endCourse();
  }).toThrow();
});


test('DbSession endCourse as teacher', (done) => {
  teacherSession.endCourse((error) => {
    expect(error).toBeNull();
    studentSession.createSession(true, (error2, files) => {
      expect(error).toBeNull();
      expect(files).toHaveLength(0);
      done();
    });
  });
});


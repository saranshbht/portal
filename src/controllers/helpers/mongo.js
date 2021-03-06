const { MongoClient } = require('mongodb');
const debug = require('debug')('app:mongoHelper');

const mongo = () => {
  const DB_PORT = process.env.DB_PORT || 27017;
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_USERNAME = process.env.DB_USERNAME || '';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const dbName = 'portal';
  const url = `mongodb://${DB_USERNAME.length ? `${DB_USERNAME}:${DB_PASSWORD}@` : ``}${DB_HOST}:${DB_PORT}`;

  const createConnection = async () => {
    debug('request for connection sent');
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    debug('request for connection accepted');
    return { client, db };
  };

  const addUser = async (req, res, userAccount) => {
    const { client, db } = await createConnection();
    const col = await db.collection('users');
    const results = await col.insertOne(userAccount);
    delete results.ops[0]._id;
    delete results.ops[0].password;
    req.logIn(results.ops[0], () => {
      res.redirect('/events');
    });
    client.close();
  };

  const findUserByEmail = async (email) => {
    const { client, db } = await createConnection();
    const col = await db.collection('users');
    const results = await col.findOne({ email });
    client.close();
    return results;
  };

  const findAllUsers = async () => {
    const { client, db } = await createConnection();
    const col = await db.collection('users');
    const allUsers = await col
      .find(
        {},
        {
          projection: {
            _id: false,
            password: false,
            friends: false,
          },
        },
      )
      .toArray();
    client.close();
    return allUsers;
  };

  const findEvent = async (eventCode) => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    const result = await col.findOne({ eventCode });
    client.close();
    return result;
  };

  const findEventAndDelete = async (eventCode) => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    const result = await col.findOneAndDelete({ eventCode });
    client.close();
    return result;
  };

  const addEvent = async (data) => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    const result = await col.insertOne(data);
    client.close();
    return result;
  };

  const findEventAndUpdateIsLive = async (eventCode, flag, isEvent) => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    if (isEvent) {
      await col.findOneAndUpdate({ eventCode }, { $set: { isEventLive: flag } });
    } else {
      await col.findOneAndUpdate({ eventCode }, { $set: { isQuizLive: flag } });
    }
    client.close();
  };

  const findAllEvents = async () => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    const allEvents = await col
      .find(
        {},
        {
          projection: {
            _id: false,
            questions: false,
            instructions: false,
            intro: false,
          },
        },
      )
      .toArray();
    client.close();
    return allEvents;
  };

  const findLiveEvents = async () => {
    const { client, db } = await createConnection();
    const col = await db.collection('events');
    const liveEvents = await col
      .find(
        { isEventLive: true },
        {
          projection: {
            _id: false,
            questions: false,
            instructions: false,
          },
        },
      )
      .toArray();
    client.close();
    return liveEvents;
  };

  const findRequestByEvent = async (eventCode) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const result = await col.find({ eventCode }).toArray();
    client.close();
    return result;
  };

  const findRequestsByUser = async (email) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const result = await col.find({ email }).toArray();
    client.close();
    return result;
  };

  const findRequestByEventUserAddRemove = async (requestData, deleteRequest) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const result = await col.findOne(
      {
        eventCode: requestData.eventCode,
        email: requestData.email,
      },
    );
    if (deleteRequest) {
      if (result) {
        if (!result.isAllowed) {
          await col.findOneAndDelete({ eventCode: requestData.eventCode, email: requestData.email });
        }
      } else {
        await col.insertOne(requestData);
      }
    }
    client.close();
    return result;
  };

  const updateIsAllowed = async (eventCode, email, flag) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const results = await col.findOneAndUpdate(
      { eventCode, email },
      { $set: { isAllowed: flag } },
    );
    client.close();
    return results;
  };

  const updateHasStarted = async (eventCode, email) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const results = await col.findOneAndUpdate(
      { eventCode, email },
      { $set: { hasStarted: true } },
    );
    client.close();
    return results;
  };

  const updateHasCompleted = async (eventCode, email) => {
    const { client, db } = await createConnection();
    const col = await db.collection('requests');
    const results = await col.findOneAndUpdate(
      { eventCode, email },
      { $set: { hasCompleted: true } },
    );
    client.close();
    return results;
  };

  const addFriend = async (friend) => {
    const { client, db } = await createConnection();
    const col = await db.collection('friends');
    const result = await col.insertOne(friend);
    client.close();
    return result;
  };

  const getFriend = async (leader, email) => {
    const { client, db } = await createConnection();
    const col = await db.collection('friends');
    const result = await col.findOne({ leader, email }, { projection: { _id: false, leader: false }});
    client.close();
    return result;
  }

  const getAllFriends = async (leader) => {
    const { client, db } = await createConnection();
    const col = await db.collection('friends');
    const result = await col.find({ leader }, {
      projection: {
        _id: false,
        leader: false,
      },
    }).toArray();
    client.close();
    return result;
  }

  const addResponseInEvent = async (eventCode, userQuizResponse) => {
    const { client, db } = await createConnection();
    const col = await db.collection(`${eventCode}`);
    const result = await col.insertOne(userQuizResponse);
    client.close();
    return result;
  };

  const findResponsesByEvent = async (eventCode) => {
    const { client, db } = await createConnection();
    const col = await db.collection(`${eventCode}`);
    const result = await col.find({}, { projection: { responseStorage: false } }).toArray();
    client.close();
    return result;
  };

  const findResponseByEventUser = async (eventCode, email) => {
    const { client, db } = await createConnection();
    const col = await db.collection(`${eventCode}`);
    const result = await col.findOne({ 'user.email': email });
    client.close();
    return result;
  };

  const resultsOfEventAddRemove = async (eventCode, eventName, user, resultType) => {
    const { client, db } = await createConnection();
    const col = await db.collection('results');
    const result = await col.findOne({
      eventCode,
      email: user.email,
      resultType,
    });
    if (result) {
      await col.findOneAndDelete({ eventCode, email: user.email, resultType });
    } else {
      await col.insertOne({ eventCode, eventName, name: user.name, email: user.email, college: user.college, teamMembers: user.teamMembers, resultType });
    }

    client.close();
    return result;
  };

  const findResultByEvent = async (eventCode) => {
    const { client, db } = await createConnection();
    const col = await db.collection('results');
    const results = await col.find({ eventCode }).toArray();
    client.close();
    return results;
  }

  const findResultOfAllEvents = async () => {
    const { client, db } = await createConnection();
    const col = await db.collection('results');
    const prelimsResults = await col.aggregate([
      {
        $match: { resultType: 'prelims' }
      },
      {
        $group:
        {
          _id: {
            eventCode: '$eventCode',
            eventName: '$eventName',
          },
          fields: { $push: { 'name': '$name', 'college': '$college', 'teamMembers': '$teamMembers' } },
        },
      },
    ]).toArray();
    const finalsResults = await col.aggregate([
      {
        $match: { resultType: 'finals' }
      },
      {
        $group:
        {
          _id: {
            eventCode: '$eventCode',
            eventName: '$eventName',
          },
          fields: { $push: { 'name': '$name', 'college': '$college', 'teamMembers': '$teamMembers' } },
        },
      },
    ]).toArray();
    client.close();
    return { prelimsResults, finalsResults };
  }

  const updatePassword = async (email, password) => {
    const { client, db } = await createConnection();
    const col = await db.collection('users');
    const results = await col.findOneAndUpdate(
      { email },
      { $set: { password } },
    );
    client.close();
    return results;
  };

  const updatePrelimsFinalsInResponses = async (eventCode, email, resultType) => {
    const { client, db } = await createConnection();
    const col = await db.collection(eventCode);
    const results = await col.findOne(
      { 'user.email': email },
    );
    const update = { $set: { }}
    if (results[resultType]) {
      update.$set[`${resultType}`] = false;
      await col.findOneAndUpdate(
        { 'user.email': email },
        update,
      );
    } else {
      update.$set[`${resultType}`] = true;
      await col.findOneAndUpdate(
        { 'user.email': email },
        update,
      );
    }
    client.close();
    return results;
  };

  return {
    createConnection,
    addUser,
    findUserByEmail,
    findAllUsers,
    findEvent,
    findEventAndUpdateIsLive,
    addEvent,
    findLiveEvents,
    findAllEvents,
    findEventAndDelete,
    findRequestByEvent,
    findRequestsByUser,
    findRequestByEventUserAddRemove,
    updateIsAllowed,
    updateHasStarted,
    updateHasCompleted,
    addFriend,
    getFriend,
    getAllFriends,
    addResponseInEvent,
    findResponsesByEvent,
    findResponseByEventUser,
    resultsOfEventAddRemove,
    findResultByEvent,
    findResultOfAllEvents,
    updatePassword,
    updatePrelimsFinalsInResponses,
  };
};

module.exports = mongo;

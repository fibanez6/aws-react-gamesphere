import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      username: a.string().required(),
      avatar: a.string(),
      rank: a.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER"]),
      xp: a.integer().required().default(0),
      level: a.integer().required().default(1),
      status: a.enum(["ONLINE", "OFFLINE", "IN_GAME", "AWAY"]),
      stats: a.hasOne('PlayerStats', 'userId'),
      activities: a.hasMany('Activity', 'userId'),
      gameStats: a.hasMany('GameStats', 'userId'),
      achievements: a.hasMany('Achievement', 'userId'),
    })
    .authorization((allow) => [allow.owner()]),

  Game: a
    .model({
      name: a.string().required(),
      genre: a.string().required(),
      coverImage: a.string().required(),
      rating: a.float().required(),
      activePlayers: a.integer().required(),
      platforms: a.string().required().array().required(),
      releaseDate: a.date(),
      developer: a.string(),
      publisher: a.string(),
      activities: a.hasMany('Activity', 'gameId'),
      gameStats: a.hasMany('GameStats', 'gameId'),
      achievements: a.hasMany('Achievement', 'gameId'),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  PlayerStats: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      gamesOwned: a.integer().required().default(0),
      achievementsUnlocked: a.integer().required().default(0),
      totalHoursPlayed: a.float().required().default(0),
      totalAchievements: a.integer().required().default(0),
      totalWins: a.integer().required().default(0),
      totalMatches: a.integer().required().default(0),
      winRate: a.float().required().default(0),
      weeklyPlaytime: a.float().required().array().required(),
      monthlyPlaytime: a.float().required().array().required(),
      currentStreak: a.integer().required().default(0),
      longestStreak: a.integer().required().default(0),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Activity: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      username: a.string().required(),
      avatar: a.string(),
      type: a.enum(["GAME_PLAYED", "ACHIEVEMENT_UNLOCKED", "FRIEND_ADDED", "LEVEL_UP", "RANK_UP"]),
      title: a.string().required(),
      description: a.string(),
      gameId: a.id(),
      game: a.belongsTo('Game', 'gameId'),
      gameName: a.string(),
      gameCover: a.string(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  GameStats: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      gameId: a.id().required(),
      game: a.belongsTo('Game', 'gameId'),
      gameName: a.string().required(),
      gameCover: a.string(),
      hoursPlayed: a.float().required().default(0),
      lastPlayed: a.datetime().required(),
      rank: a.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER"]),
      winRate: a.float().required().default(0),
      totalMatches: a.integer().required().default(0),
      wins: a.integer().required().default(0),
      losses: a.integer().required().default(0),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),

  Achievement: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      gameId: a.id(),
      game: a.belongsTo('Game', 'gameId'),
      name: a.string().required(),
      description: a.string().required(),
      icon: a.string().required(),
      rarity: a.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]),
      unlockedAt: a.datetime(),
      gameName: a.string(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

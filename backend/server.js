require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const bcrypt = require('bcrypt');
const jwt = require('@fastify/jwt');
const { Sequelize } = require('sequelize');
const path = require('path')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './eljour.db'
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
});

fastify.register(require('@fastify/cors'), { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']});
fastify.decorate('checkPermission', (permissionSlug) => {
  return async (request, reply) => {
    const { role_id } = request.user;
    const [hasPermission] = await sequelize.query(
      `SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_ID = p.ID
      WHERE rp.role_ID = ? AND p.slug = ? LIMIT 1 `
    , { replacements: [role_id, permissionSlug], type: Sequelize.QueryTypes.SELECT });

    if (!hasPermission) {
      return reply.code(403).send({ error: 'У вас нет прав на это действие' });
    }
  };
});

fastify.register(require('./routes/users'), { 
  prefix: '/api/users',
  sequelize: sequelize 
});

fastify.register(require("./routes/journal"), {
  prefix: '/api',
  sequelize: sequelize
});

fastify.register(require('./routes/curriculum'), {
  prefix: '/api',
  sequelize: sequelize
})

fastify.register(require('./routes/schedule'), {
  prefix: '/api',
  sequelize: sequelize
})

fastify.register(require('./routes/setings'), {
  prefix: '/api',
  sequelize: sequelize
})

  fastify.register(require('./routes/classes'), {
    prefix: '/api/classes',
    sequelize
  });

  fastify.register(require('./routes/subjects'), {
    prefix: '/api/subjects',
    sequelize
  });

  fastify.register(require('./routes/grades'), {
    prefix: '/api/grades',
    sequelize
  });

  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'uploads'),
    prefix: '/uploads/'
  });

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const [user] = await sequelize.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    { replacements: [email], type: Sequelize.QueryTypes.SELECT }
  );

  if (!user) return reply.code(401).send({ message: 'Пользователь не найден' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return reply.code(401).send({ message: 'Неверный пароль' });

  const perms = await sequelize.query(
    `SELECT p.slug FROM permissions p 
    JOIN role_permissions rp ON p.ID = rp.permission_ID 
    WHERE rp.role_ID = ? `,
    { replacements: [user.role_id], type: Sequelize.QueryTypes.SELECT }
  );

  const profile = await sequelize.query(
    'SELECT first_name, last_name FROM profiles WHERE ID = ?',
    { replacements: [user.ID], type: Sequelize.QueryTypes.SELECT }
  );
  const [prof] = profile;
  const tokenPayload = {
    id: user.ID,
    role_id: user.role_id,
    permissions: perms.map(p => p.slug),
    first_name: prof?.first_name,
    last_name: prof?.last_name,
  };
  const token = fastify.jwt.sign(tokenPayload);
  return { token };
});

const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT || 3001 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
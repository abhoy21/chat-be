import { compare, hash } from "bcrypt";
import { Response, Router } from "express";
import { prisma } from "../prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { authMiddleware, AuthRequest } from "../http-middleware/middleware";
import { generateAccessTokenWithRefreshToken } from "./helper";

const router: Router = Router();

interface RoomProps extends AuthRequest {
  body: {
    name: string;
  };
}

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/signup", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      res.status(400).send("Missing required fields");
      return;
    }
    const hashedPassword = await hash(
      password,
      Number(process.env.SALT_ROUNDS!)
    );
    const response = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
    if (!response) {
      res.status(500).send("Failed to create user");
    }
    res.status(200).send("User created successfully");
  } catch (error) {
    console.log("Internal Server Error", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("Missing required fields");
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).send("Invalid Password");
      return;
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenWithRefreshToken(user.id);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Internal Server Error", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/logout",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).send("Unauthorized");
        return;
      }
      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          refreshToken: "",
        },
      });

      res.status(200).json({ message: "Logged out successfully", user });
    } catch (error) {
      console.log("Internal Server Error", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.post("/refresh-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    const oldRefreshToken = authHeader?.split(" ")[1];
    if (!oldRefreshToken) {
      res.status(400).send("Missing required fields");
      return;
    }
    const refreshTokenPayload = jwt.verify(
      oldRefreshToken,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    if (!refreshTokenPayload.userId) {
      res.status(401).send("Unauthorized");
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        id: refreshTokenPayload.userId,
      },
    });

    if (!user) {
      res.status(401).send("No user found");
      return;
    }

    if (oldRefreshToken !== user.refreshToken) {
      res.status(401).send("Refresh Token Expired!");
      return;
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenWithRefreshToken(user.id);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log("Internal Server Error", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/create-room",
  authMiddleware,
  async (req: RoomProps, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).send("Unauthorized");
        return;
      }
      const name = req.body.name;

      const existingRoom = await prisma.room.findFirst({
        where: {
          name,
        },
      });

      if (existingRoom) {
        res.status(400).json({ message: "Room already exists", existingRoom });
        return;
      }

      const room = await prisma.room.create({
        data: {
          name,
          adminId: userId,
        },
      });

      res.status(200).json({ message: "Room created successfully", room });
    } catch (error) {
      console.log("Internal Server Error", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

export default router;

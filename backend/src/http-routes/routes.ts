import { compare, hash } from "bcrypt";
import { Response, Router } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";
import { authMiddleware, AuthRequest } from "../http-middleware/middleware";

const router: Router = Router();

interface RoomProps extends AuthRequest {
  body: {
    name: string;
  };
}

// interface ChatProps extends AuthRequest {
//   params: {
//     roomId: string;
//   };
// }

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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    res.status(200).send({ token });
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

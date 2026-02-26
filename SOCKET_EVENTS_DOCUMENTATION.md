# Socket.IO Events Documentation - Real-time Friend System

## 📌 Overview

Hệ thống sử dụng Socket.IO để cập nhật real-time khi có lời mời kết bạn, chấp nhận/từ chối, và xóa bạn bè.

---

## 🔌 Connection Setup

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Initialize Socket Connection

```javascript
// src/socket.js
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:3000"; // Thay bằng URL backend của bạn

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;
```

### 3. Setup User Room (QUAN TRỌNG!)

**Phải gọi setup với userId ngay sau khi đăng nhập thành công**

```javascript
// src/services/authService.js hoặc src/App.jsx
import socket from "./socket";

// Sau khi login thành công, lấy userId từ response
const userId = response.data.user._id;

// Join room với userId để nhận events
socket.emit("setup", userId);

socket.on("connected", () => {
  console.log("✅ Socket connected and user room joined");
});
```

---

## 📡 Socket Events

### 1️⃣ Friend Request Received (Nhận lời mời kết bạn)

**Event Name:** `friend_request_received`

**Trigger:** Khi có người gửi lời mời kết bạn cho bạn

**Payload:**

```javascript
{
  requestId: "64abc123...",      // ID của friend request
  sender: {
    _id: "64xyz789...",          // ID người gửi
    displayName: "John Doe",      // Tên người gửi
    avatar: "https://..."         // Avatar người gửi
  },
  createdAt: "2026-02-26T10:30:00Z"
}
```

**Frontend Implementation:**

```javascript
import socket from "./socket";

socket.on("friend_request_received", (data) => {
  console.log("📩 New friend request:", data);

  // 1. Thêm vào danh sách lời mời kết bạn
  setFriendRequests((prev) => [
    {
      _id: data.requestId,
      senderId: data.sender,
      createdAt: data.createdAt,
    },
    ...prev,
  ]);

  // 2. Hiển thị notification
  toast.info(`${data.sender.displayName} đã gửi lời mời kết bạn`);

  // 3. Update badge count
  setUnreadFriendRequestCount((prev) => prev + 1);

  // 4. Play notification sound (optional)
  playNotificationSound();
});
```

---

### 2️⃣ Friend Request Accepted (Lời mời được chấp nhận)

**Event Name:** `friend_request_accepted`

**Trigger:** Khi người khác chấp nhận lời mời kết bạn của bạn

**Payload:**

```javascript
{
  acceptedBy: {
    _id: "64xyz789...",
    displayName: "Jane Smith",
    avatar: "https://..."
  },
  requestId: "64abc123..."
}
```

**Frontend Implementation:**

```javascript
socket.on("friend_request_accepted", (data) => {
  console.log("✅ Friend request accepted:", data);

  // 1. Xóa khỏi danh sách "sent requests"
  setSentRequests((prev) => prev.filter((req) => req._id !== data.requestId));

  // 2. Hiển thị notification
  toast.success(`${data.acceptedBy.displayName} đã chấp nhận lời mời kết bạn`);

  // 3. Có thể refetch friend list hoặc navigate
  refetchFriends();
});
```

---

### 3️⃣ Friend Request Rejected (Lời mời bị từ chối)

**Event Name:** `friend_request_rejected`

**Trigger:** Khi người khác từ chối lời mời kết bạn của bạn

**Payload:**

```javascript
{
  rejectedBy: {
    _id: "64xyz789...",
    displayName: "Bob Wilson"
  },
  requestId: "64abc123..."
}
```

**Frontend Implementation:**

```javascript
socket.on("friend_request_rejected", (data) => {
  console.log("❌ Friend request rejected:", data);

  // Xóa khỏi danh sách "sent requests"
  setSentRequests((prev) => prev.filter((req) => req._id !== data.requestId));

  // Optional: Hiển thị notification nhẹ nhàng
  console.log(`${data.rejectedBy.displayName} đã từ chối lời mời`);
});
```

---

### 3️⃣.1 Friend Request Removed (Xóa lời mời khỏi danh sách)

**Event Name:** `friend_request_removed`

**Trigger:** Khi bạn từ chối lời mời kết bạn (tự động xóa khỏi danh sách của bạn)

**Payload:**

```javascript
{
  requestId: "64abc123...";
}
```

**Frontend Implementation:**

```javascript
socket.on("friend_request_removed", (data) => {
  console.log("🗑️ Friend request removed:", data);

  // Xóa khỏi danh sách lời mời kết bạn
  setFriendRequests((prev) => prev.filter((req) => req._id !== data.requestId));

  // UI tự động cập nhật
  toast.success("Đã từ chối lời mời kết bạn");
});
```

---

### 4️⃣ Friend List Updated (Cập nhật danh sách bạn bè)

**Event Name:** `friend_list_updated`

**Trigger:** Khi chấp nhận lời mời kết bạn (cả 2 users đều nhận event này)

**Payload:**

```javascript
{
  newFriend: {
    _id: "64xyz789...",
    displayName: "Alex Johnson",
    avatar: "https://...",
    bio: "Hey there!",
    isOnline: false
  }
}
```

**Frontend Implementation:**

```javascript
socket.on("friend_list_updated", (data) => {
  console.log("👥 Friend list updated:", data);

  // 1. Thêm bạn mới vào danh sách
  setFriends((prev) => [...prev, data.newFriend]);

  // 2. Xóa khỏi pending requests
  setFriendRequests((prev) =>
    prev.filter((req) => req.senderId._id !== data.newFriend._id),
  );

  // 3. Update UI
  toast.success(`Bạn và ${data.newFriend.displayName} đã là bạn bè`);
});
```

---

### 5️⃣ Friend Removed (Xóa bạn bè)

**Event Name:** `friend_removed`

**Trigger:** Khi ai đó xóa bạn bè (cả 2 users đều nhận event này)

**Payload:**

```javascript
{
  removedFriendId: "64xyz789...";
}
```

**Frontend Implementation:**

```javascript
socket.on("friend_removed", (data) => {
  console.log("🗑️ Friend removed:", data);

  // 1. Xóa khỏi danh sách bạn bè
  setFriends((prev) =>
    prev.filter((friend) => friend._id !== data.removedFriendId),
  );

  // 2. Xóa conversation nếu đang mở
  if (currentConversation?.partnerId === data.removedFriendId) {
    setCurrentConversation(null);
    navigate("/messages");
  }

  // 3. Update UI
  toast.info("Một người bạn đã xóa bạn khỏi danh sách");
});
```

---

## 🚀 Complete React Example

### App.jsx (Setup Socket)

```javascript
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import socket from "./socket";

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?._id) {
      // Setup socket khi user đăng nhập
      socket.emit("setup", user._id);

      socket.on("connected", () => {
        console.log("✅ Socket connected");
      });

      return () => {
        socket.off("connected");
      };
    }
  }, [user]);

  return <Router>{/* Your routes */}</Router>;
}
```

### FriendRequestsPage.jsx (Listen to Events)

```javascript
import { useEffect, useState } from "react";
import socket from "../socket";
import { toast } from "react-toastify";

function FriendRequestsPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetchPendingRequests();

    // ✅ Listen to real-time events
    socket.on("friend_request_received", handleNewRequest);
    socket.on("friend_request_removed", handleRequestRemoved);
    socket.on("friend_list_updated", handleFriendAdded);

    return () => {
      socket.off("friend_request_received", handleNewRequest);
      socket.off("friend_request_removed", handleRequestRemoved);
      socket.off("friend_list_updated", handleFriendAdded);
    };
  }, []);

  const handleNewRequest = (data) => {
    setRequests((prev) => [
      {
        _id: data.requestId,
        senderId: data.sender,
        createdAt: data.createdAt,
      },
      ...prev,
    ]);

    toast.info(`${data.sender.displayName} đã gửi lời mời kết bạn`);
  };

  const handleRequestRemoved = (data) => {
    // Xóa request khi từ chối
    setRequests((prev) => prev.filter((req) => req._id !== data.requestId));
  };

  const handleFriendAdded = (data) => {
    // Remove from pending requests khi chấp nhận
    setRequests((prev) =>
      prev.filter((req) => req.senderId._id !== data.newFriend._id),
    );

    toast.success(`Bạn và ${data.newFriend.displayName} đã là bạn bè`);
  };

  const fetchPendingRequests = async () => {
    const response = await fetch("/api/users/friend-requests/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setRequests(data.requests);
  };

  // Hàm từ chối (gọi API, backend sẽ emit event)
  const handleReject = async (requestId) => {
    try {
      await fetch(`/api/users/friend-requests/${requestId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Không cần setState ở đây, socket event sẽ tự động xóa
    } catch (error) {
      toast.error("Lỗi khi từ chối lời mời");
    }
  };

  return (
    <div>
      <h1>Lời mời kết bạn ({requests.length})</h1>
      {requests.map((request) => (
        <FriendRequestCard
          key={request._id}
          request={request}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
```

---

## 🔍 Debugging

### Kiểm tra Socket Connection

```javascript
// Check connection status
console.log("Socket connected:", socket.connected);

// Monitor all events
socket.onAny((eventName, ...args) => {
  console.log(`📡 Event received: ${eventName}`, args);
});

// Check if joined room
socket.emit("setup", userId);
socket.on("connected", () => {
  console.log("✅ Joined room:", userId);
});
```

### Backend Logs

Thêm logging vào controller để debug:

```javascript
// user.controller.js
const io = req.app.get("io");
console.log('🔔 Emitting friend_request_received to:', receiverId.toString());
io.to(receiverId.toString()).emit("friend_request_received", {
  requestId: result._id,
  sender: { ... }
});
```

---

## ⚠️ Common Issues

### 1. **Không nhận được events**

- ✅ Đảm bảo đã gọi `socket.emit('setup', userId)` sau khi login
- ✅ userId phải là string: `userId.toString()`
- ✅ Kiểm tra socket connected: `socket.connected === true`

### 2. **Events bị duplicate**

- ✅ Cleanup listeners trong `useEffect` return
- ✅ Không register listeners nhiều lần

### 3. **Socket disconnect**

- ✅ Enable reconnection trong socket config
- ✅ Re-setup room sau khi reconnect

---

## 📝 Summary

| Event                     | Khi nào xảy ra            | Ai nhận                        |
| ------------------------- | ------------------------- | ------------------------------ |
| `friend_request_received` | A gửi lời mời cho B       | B nhận                         |
| `friend_request_accepted` | B chấp nhận lời mời của A | A nhận                         |
| `friend_request_rejected` | B từ chối lời mời của A   | A nhận                         |
| `friend_request_removed`  | B từ chối lời mời         | B nhận (để xóa khỏi danh sách) |
| `friend_list_updated`     | B chấp nhận lời mời       | Cả A và B nhận                 |
| `friend_removed`          | A xóa bạn B               | Cả A và B nhận                 |

---

## 🎯 Best Practices

1. **Setup socket ngay sau login** - Đừng chờ đến khi vào trang friend requests
2. **Cleanup listeners** - Luôn off() trong useEffect cleanup
3. **Optimistic updates** - Update UI ngay khi gọi API, socket chỉ để sync
4. **Error handling** - Catch socket errors và reconnect
5. **Loading states** - Show skeleton khi đang fetch initial data

---

## 📞 Support

Nếu có vấn đề, check:

- Backend logs: `console.log` trong controller
- Frontend logs: `socket.onAny()` để xem tất cả events
- Network tab: Xem WS connection status

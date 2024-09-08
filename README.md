# ShareHub

**ShareHub** is a full-stack web application built with the MERN stack (MongoDB, Express.js, React, and Node.js) that allows users to upload, arrange, and share various types of files (photos, videos, documents, etc.). Users can create instances, organize files into groups, and share them with others using a password-protected system.

## Features
- **Upload and Manage Different File Types**: Supports the upload of photos, videos, documents, and more.
- **Organize Files into Groups**: Users can categorize and group their files for better organization.
- **Share Files with Others Securely**: Files can be shared with others using a password-protected system.
- **User Authentication and Authorization**: Secure user registration, login, and profile management.

## Testing

The application has been thoroughly tested to ensure core functionalities are working as expected. Testing covers user authentication, file uploads, instance and group management, and resource handling. Automated JavaScript tests have been written in Postman.

**Hierarchical Structure:**
1. **Instance**
   - **Groups**
     - **Images**
     - **Docs**
     - **Videos**

2. **Detailed Structure:**
   - **Instance**: Contains ID, title, description, and associated groups.
   - **Groups**: Within an instance, includes ID, name, description, and resources categorized by type.
   - **Resources**: Within a group, includes categorized resources such as images, documents, and videos with their respective metadata.

**Additional Features:**
- **Cascading Deletion**: When an instance is deleted, all related groups, documents, images, videos, and comments are also removed. Resources are cleaned up from Cloudinary before removing database entries.
- **Multer File Uploads**: Utilizes advanced Multer features like file filtering based on extensions and MIME types to ensure only allowed file types are processed.

## Documentation

For detailed Postman testing documentation, please refer to the 
[![Postman Testing Documentation](https://via.placeholder.com/800x400)](https://tse1.mm.bing.net/th?id=OIP.7xmteOV3RYQeOSSmn-f8TgHaCv&pid=Api&P=0&h=220)


Feel free to use this description and the provided documentation link for further information on the ShareHub project.

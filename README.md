# file-save-uploader README

I write this to upload my file to my VM once it is saved...

## Features

This is how I used this.
First, I add my public key in my VM. Then I will run a SCP command to upload my local file to the remote file.
Once it is done, any newly saved file will be uploaded.
I just did it for fun.

To use this, please follow the step:
1. create file .uploadrc under the root path in your workspace.
2. The content of file should look like follows:
```
{
  "root": "/opt/my_remote_root_folder",
  "url": "root@10.0.10.121"
}
```
*IMPORTANT* I did not create folders if the remote folder does not exist. You will see an error if the file failed to SCP.



## Requirements

1. You should have a remote machine.
2. Your machine should accept SCP command.
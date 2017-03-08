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
3. If you want to disable the uploader function. You can either disable the plugin for the workspace. Or you can set this in .updaterc:
```
{
  "disabled": true,
  "root": "/opt/my_remote_root_folder",
  "url": "root@10.0.10.121"
}
```

You also can upload the whole workspace for the init purpose.
You can press F1 in your workspace and select "Upload Whole Workspace" command to upload the workspace.
You can update your .uploadrc like this:
```
{
  "disabled": true,
  "root": "/opt/my_remote_root_folder",
  "url": "root@10.0.10.121",
  "ignores": ["node_modules", ".git"]
}
```
so that those folders can be ignored.



## Requirements

1. Node 6.0 or above is required. Because I used some ES6 syntax.
2. You should have a remote machine.
3. Your machine should accept SCP command. (So I don't think Windows can use it...)
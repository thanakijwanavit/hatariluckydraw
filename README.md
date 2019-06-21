Using Git to Manage a Live Web Site
===================================

### Overview

As a freelancer, I build a lot of web sites.  That's a lot of code changes to track.  Thankfully, a Git-enabled workflow with proper branching makes short work of project tracking.  I can easily see development features in branches as well as a snapshot of the sites' production code.  A nice addition to that workflow is that ability to use Git to push updates to any of the various sites I work on while committing changes.

#### Contents <a name="top"></a>
+ [Prerequisites](#pr)
+ [Getting Started](#gs)
  - [Installing Git](#ig)
  - [Setting up Passwordless SSH Access](#su)
+ [Configuring the Remote Repository](#ctr)
  - [Setting up a Bare Repository](#sub)
  - [Add a Post-Receive Hook](#ap)
+ [Configuring the Local Development Machine](#ctl)
  - [Setting up the Working Repository](#suw)
  - [Add a Remote Repository Pointing to the Web Server](#ar)
+ [Build Something Beautiful](#bs)
+ [Additional Tips](#at)
  - [Pushing Changes to Multiple Servers](#pc)
  - [Ignoring Local Changes to Tracked Files](#il)


### Prerequisites <a name="pr"></a>

* Git, *installed on both the development machine and the live server*
* a basic working knowledge of Git, beginners welcome!
* passwordless SSH access to your server using pre-shared keys
* a hobby (you'll have a lot of extra time on your hands with the quicker workflow)

[back to top](#top)

___

### Getting Started <a name="gs"></a>

#### Installing Git <a name="ig"></a>
Git is available for Windows, Linux, and Mac.  Getting it installed and running is a pretty straightforward task.  Check out the following link for updated instructions on getting Git up and running.

[Getting Started Installing Git][1]

You'll need to have Git installed on your development machines as well as on the server or servers where you wish to host your website.  This process can even be adapted to work with multiple servers such as mirrors behind a load balancer.

[back to top](#top)

#### Setting up Passwordless SSH Access <a name="su"></a>
The process for updating a live web server relies on the use of post hooks within the Git environment.  Since this is fully automated, there is no opportunity to enter login credentials while establishing the SSH connection to the remote server.  To work around this, we are going to set up passwordless SSH access.  To begin, you will need to SSH into your server.

```shell
ssh user@hostname
```

Next, you'll need to make sure you have a `~/.ssh` in your user's home directory.  If not, go ahead and create one now.

```shell
mkdir ~/.ssh
```

On Mac and Linux, you can harness the power of terminal to do both in one go.

```shell
if [ ! -d ~/.ssh ]; then mkdir ~/.ssh; fi
```

Next you'll need to [generate a public SSH key][2] if you don't already have one. List the files in your `~/.ssh` directory to check.

```shell
ls -al ~/.ssh
```

The file you're looking for is usually named similarly to `id_rsa.pub`.  If you're not sure, you can generate a new one.  The command below will create an SSH key using the provided email as a label.

```shell
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

You'll probably want to keep all of the default settings.  This will should create a file named `id_rsa` in the `~/.ssh` directory created earlier.

When prompted, be sure to provide [a secure SSH passphrase][3].

If you had to create an SSH key, you'll need to configure the ssh-agent program to use it.

```shell
ssh-add ~/.ssh/id_rsa
```

If you know what you are doing, you can use an existing SSH key in your `~/.ssh` directory by providing the private key file to ssh-agent.

If you're still not sure what's going on, you should two files in your `~/.ssh` directory that correspond to the private and public key files.  Typically, the public key will be a file by the same name with a .pub extension added.  An example would be a private key file named `id_rsa` and a public key file named `id_rsa.pub`.

Once you have generated an SSH key on your local machine, it's time to put the matching shared key file on the server.

```shell
ssh-copy-id -i ~/.ssh/id_rsa.pub user@hostname
```

This will add your public key to the authorized keys on the remote server.  This process can be repeated from each development machine to add as many authorized keys as necessary to the server.  You'll know you did it correctly when you close your connection and reconnect without being prompted for a password.

[back to top](#top)

___

### Configuring the Remote Server Repository <a name="ctr"></a>

The machine you intend to use as a live production server needs to have a Git repository that can write to an appropriate web-accessible directory.  The Git metadata (the .git directory) does not need to be in a web-accessible location.  Instead, it can be anywhere that is user-writeable by your SSH user.

[back to top](#top)

#### Setting up a Bare Repository <a name="sub"></a>

In order to push files to your web server, you'll need to have a copy of your repository on your web server.  You'll want to start by creating a bare repository to house your web site.  The repository should be set up somewhere outside of your web root.  We'll instruct Git where to put the actual files later.  Once you decide on a location for your repository, the following commands will create the bare repository.

```shell
mkdir mywebsite.git
cd mywebsite.git
git init --bare --shared
```

A bare repository contains all of the Git metadata without any HEAD.  Essentially, this means that your repository has a `.git` directory, but does not have any working files checked out.  The next step is to create a Git hook that will check out those files any time you instruct it to.

> If you wish to run git commands from the detached work tree, you'll need to set the environmental variable `GIT_DIR` to the path of `mywebsite.git` before running any commands.

[back to top](#top)

#### Add a Post-Receive Hook <a name="ap"></a>

Create a file named `post-receive` in the hooks directory of your repository with the following contents.

```bash
#!/bin/sh
GIT_WORK_TREE=/path/to/webroot/of/mywebsite git checkout -f
```

Once you create your hook, go ahead and mark it as executable.

```shell
chmod +x hooks/post-receive
```

`GIT_WORK_TREE` allows you to instruct Git where the working directory should be for a repository.  This allows you to keep the repository outside of the web root with a detached work tree in a web accessible location.  Make sure the path you specify exists, Git will not create it for you.

[back to top](#top)

___

### Configuring the Local Development Machine <a name="ctl"></a>

The local development machine will house the web site repository.  Relevant files will be copied to the live server whenever you choose to push those changes.  This means you should keep a working copy of the repository on your development machine.  You could also employ the use of any centralized repository including cloud-based ones such as GitHub or BitBucket.  Your workflow is entirely up to you.  Since all changes are pushed from the local repository, this process is not affected by how you choose to handle your project.

[back to top](#top)

#### Setting up the Working Repository <a name="suw"></a>

On your development machine, you should have a working Git repository.  If not, you can create one in an existing project directory with the following commands.

```shell
git init
git add -A
git commit -m "Initial Commit"
```

[back to top](#top)

#### Add a Remote Repository Pointing to the Web Server <a name="ar"></a>

Once you have a working repository, you'll need to add a remote pointing to the one you set up on your server.

```shell
git remote add live ssh://server1.example.com/home/user/mywebsite.git
```

Make sure the hostname and path you provide point to the server and repository you set up previously.  If your remote user name is different from that of your local machine, you'll need to modify the above command to include the remote user name.

```shell
git remote add live ssh://user@server1.example.com/home/user/mywebsite.git
```

Finally, it's time to push your current website to the live server for the first time.

```shell
git push live +master:refs/heads/master
```

This command instructs Git to push the current master branch to the `live` remote.  (There's no need to send any other branches.)  In the future, the server will only check out from the master branch so you won't need to specify that explicitly every time.

[back to top](#top)

___

### Build Something Beautiful <a name="bs"></a>

Everything is ready to go.  It's time to let the creative juices flow!  Your workflow doesn't need to change at all.  Whenever you are ready, pushing changes to the live web server is as simple as running the following command.

```shell
git push live
```

> Setting `receive.denycurrentbranch` to "ignore" on the server eliminates a warning issued by recent versions of Git when you push an update to a checked-out branch on the server.

[back to top](#top)

___

### Additional Tips <a name="at"></a>

Here are a few more tips and tricks that you may find useful when employing this style of workflow.

[back to top](#top)

#### Pushing Changes to Multiple Servers <a name="pc"></a>

You may find the need to push to multiple servers.  Perhaps you have multiple testing servers or your live site is mirrored across multiple servers behind a load balancer.  In any case, pushing to multiple servers is as easy as adding more urls to the `[remote "live"]` section in `.git/config`.

    [remote "live"]
	    url = ssh://server1.example.com/home/user/mywebsite.git
		url = ssh://server2.example.com/home/user/mywebsite.git

Now issuing the command `git push live` will update all of the urls you've added at one time.  Simple!

[back to top](#top)

#### Ignoring Local Changes to Tracked Files <a name="il"></a>

From time to time you'll find there are files you want to track in your repository but don't wish to have changed every time you update your website.  A good example would be configuration files in your web site that have settings specific to the server the site is on.  Pushing updates to your site would ordinarily overwrite these files with whatever version of the file lives on your development machine.  Preventing this is easy.  SSH into the remote server and navigate into the Git repository.  Enter the following command, listing each file you wish to ignore.

```shell
git update-index --assume-unchanged <file...>
```

This instruct Gits to ignore any changes to the specified files with any future checkouts.  You can reverse this effect on one or more files any time you deem necessary.

```shell
git update-index --no-assume-unchanged <file...>
```

If you want to see a list of ignored files, that's easy too.

```shell
git ls-files -v | grep ^[a-z]
```

[back to top](#top)

____
#### References

 + [Deploy Your Website Changes Using Git](http://sebduggan.com/blog/deploy-your-website-changes-using-git/)
 + [A simple Git deployment strategy for static sites](http://nicolasgallagher.com/simple-git-deployment-strategy-for-static-sites/)
 + [Using Git to manage a website](http://toroid.org/git-website-howto)
 + [Ignoring Local Changes to Tracked Files in Git](https://www.coshx.com/blog/2013/02/26/ignoring-local-changes-to-tracked-files-with-git/)


[1]: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
[2]: https://help.github.com/articles/generating-ssh-keys/
[3]: https://help.github.com/articles/working-with-ssh-key-passphrases

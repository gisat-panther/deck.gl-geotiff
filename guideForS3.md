# Guide how to use S3 server
*for Gisat internal purposes*

## Step 1: Set up connection
You need to get your credentials first: 

```
host: eu-central-1.linodeobjects.com
bucket: gisat-gis
key: ***
secret: ***
```

For Windows connection use [WinSCP](https://winscp.net/eng/index.php):
    
Navigate to *Tabs -> New Tab* and create *New Site*.
- file protocol to `Amazon S3`
- host name is: `eu-central-1.linodeobjects.com`
- access key ID is the obtained `key`
- secret access key is the obtained `secret`

    <img src = "/images/winscp_new_site_1.jpg" width = "70%">

- Go to *Advanced -> Directories* and set Remote directory to `gisat-gis`

    <img src = "/images/winscp_new_site_2.jpg" width = "70%">

## Step 2: Upload data
Now, you should see window with two menus; on the left menu you can see your local directories, 
on the right menu there is data structure of the Gisat's S3 server. Navigate to the local file you would like to upload and
drag and drop it to the desired folder on the S3 server.

:exclamation: You must update visibility in file *Properties* that it is readable for everyone:

  <img src = "/images/winscp_new_site_3.jpg" width = "30%">

## Step 3: Get link
Based on the directory where you uploaded your data, the data URL is following:

https://gisat-gis.eu-central-1.linodeobjects.com/project_folder/cog_file_name.tif

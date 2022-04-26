# 느프트 데이터 가져오기

# input

```json
{
  "keys": ["<NFT KEY 1>", "<NFT KEY 2>"]
}

// content-type = application/json
```

# output

## metadata

```json
[
    {
        "nftKey" : "<NFT KEY 1>",
        "isValidKey" : true | false,
        "metadata" : {
            "name" : "<NFT NAME>",
            "description" : "<NFT DESCRIPTION>",
            ...
        },
        "state" : true | false
    }
]

```

## image

```json
[
    {
        "nftKey" : "<NFT KEY 1>",
        "isValidKey" : true | false,
        "image" : "<Image Url>",
        "state" : true | false
    }
]

```

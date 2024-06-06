# Fractal Visions Marketplace Contract

This is an Hardhat with Foundry Project

Try running some of the following tasks:


To run individual test, 
```shell
 forge test --match-path test/{the file path}
 ```
e.g 
```shell
forge test --match-path test/direct-listings/_payout/_payout.t.sol 
```

To run all test at once
```shell
chmod +x run_all_tests.sh 
```                                          
and

 ```shell
 find test -type f -name "*.t.sol" -exec forge test --match-path {} \;
 ```
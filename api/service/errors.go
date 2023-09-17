package service

import "fmt"

func invalidArgumentError(err error) error {
	return fmt.Errorf("invalid argument: %v", err)
}

func invalidResponseError(err error) error {
	return fmt.Errorf("invalid response: %v", err)
}

func failedToFetchError(entity string, err error) error {
	return fmt.Errorf("failed to fetch %s: %v", entity, err)
}

func failedToCreateError(entity string, err error) error {
	return fmt.Errorf("failed to create %s: %v", entity, err)
}

func notFoundError(entity string) error {
	return fmt.Errorf("%s not found", entity)
}
